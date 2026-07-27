import json
import os
import sys
import urllib.request
import socket
import subprocess
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from PIL import Image as PILImage, ImageOps

socket.setdefaulttimeout(8)

def export_products_json(project_dir):
    """Runs tsx script to dump ONLY LIVE DB products to scripts/products.json ordered by DB creation time."""
    script_code = """
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import ws from 'ws';

const envPath = path.join(process.cwd(), '.env.local');
let env: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
}

async function main() {
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  let liveProducts: any[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, { realtime: { transport: ws } });
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbProducts && dbProducts.length > 0) {
        liveProducts = dbProducts;
      }
    } catch (e: any) {
      console.error('Supabase fetch notice:', e.message);
    }
  }

  const outPath = path.join(process.cwd(), 'scripts', 'products.json');
  fs.writeFileSync(outPath, JSON.stringify(liveProducts, null, 2));
}
main();
"""
    exporter_path = os.path.join(project_dir, 'scripts', 'export_runner.ts')
    with open(exporter_path, 'w', encoding='utf-8') as f:
        f.write(script_code)

    try:
        subprocess.run(['npx', 'tsx', exporter_path], cwd=project_dir, check=True)
    except Exception as e:
        print(f"Notice during product export: {e}")
    finally:
        if os.path.exists(exporter_path):
            os.remove(exporter_path)

def get_product_main_image(prod):
    """Returns the primary 1st full image (prod['image']) as shown in the storefront modal."""
    if prod.get('image'):
        return prod.get('image')
    imgs = prod.get('images')
    if isinstance(imgs, list) and len(imgs) > 0:
        return imgs[0]
    return None

def resolve_image(img_val, pid, project_dir, cache_dir):
    """Resolves local or remote image URL to absolute file path."""
    if not img_val:
        return None

    img_val = str(img_val).strip()
    pid_clean = str(pid).replace('-', '').lower()

    if img_val.startswith('http://') or img_val.startswith('https://'):
        filename = img_val.split('/')[-1]
        cache_path = os.path.join(cache_dir, filename)
        if not os.path.exists(cache_path):
            try:
                req = urllib.request.Request(img_val, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=6) as response, open(cache_path, 'wb') as out_file:
                    out_file.write(response.read())
            except Exception as e:
                print(f"Image download failed for {pid_clean}: {e}")
        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
            return cache_path

    # Try exact relative path
    rel = img_val.lstrip('/')
    abs_path = os.path.join(project_dir, 'public', rel)
    if os.path.exists(abs_path) and os.path.isfile(abs_path):
        return abs_path

    # Try matching filename in public/images
    base_fname = os.path.basename(rel).lower()
    public_images = os.path.join(project_dir, 'public', 'images')
    if os.path.exists(public_images):
        for f in os.listdir(public_images):
            if f.lower() == base_fname:
                return os.path.join(public_images, f)
            f_clean = f.replace('-', '').replace('_', '').lower().split('.')[0]
            if pid_clean in f_clean or f_clean in pid_clean:
                return os.path.join(public_images, f)

    return None

def build_section_flowables(title, details_dict, section_hdr_style, detail_text_style):
    """Formats a details dictionary into clean 2-column or full-width lines."""
    flowables = []
    if not details_dict or not isinstance(details_dict, dict):
        return flowables

    pairs = []
    for k, v in details_dict.items():
        if v and str(v).strip() and str(v).strip().lower() != 'none':
            key_name = k.replace('flair', 'Flare').replace('drapeNote', 'Drape Note').capitalize()
            pairs.append((key_name, str(v).strip()))

    if not pairs:
        return flowables

    flowables.append(Paragraph(f"<b>■ {title}</b>", section_hdr_style))

    line_buffer = []
    for key_name, val in pairs:
        entry = f"<b>{key_name}:</b> {val}"
        if len(val) > 35:
            if line_buffer:
                flowables.append(Paragraph(" &nbsp;&nbsp;|&nbsp;&nbsp; ".join(line_buffer), detail_text_style))
                line_buffer = []
            flowables.append(Paragraph(entry, detail_text_style))
        else:
            line_buffer.append(entry)
            if len(line_buffer) == 2:
                flowables.append(Paragraph(" &nbsp;&nbsp;|&nbsp;&nbsp; ".join(line_buffer), detail_text_style))
                line_buffer = []

    if line_buffer:
        flowables.append(Paragraph(" &nbsp;&nbsp;|&nbsp;&nbsp; ".join(line_buffer), detail_text_style))

    return flowables

def build_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    cache_dir = os.path.join(script_dir, 'img_cache')
    os.makedirs(cache_dir, exist_ok=True)

    # 1. Export ONLY live DB products
    export_products_json(project_dir)

    json_path = os.path.join(script_dir, 'products.json')
    pdf_output_path = os.path.join(project_dir, 'public', 'catalog.pdf')

    if not os.path.exists(json_path):
        print(f"Error: {json_path} does not exist!")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        products = json.load(f)

    # 2. Filter out Coming Soon products
    def is_coming_soon(p):
        tag = str(p.get('tag') or '').strip().lower()
        if 'coming soon' in tag or 'comingsoon' in tag or 'coming-soon' in tag:
            return True
        return False

    filtered_products = [p for p in products if not is_coming_soon(p)]

    # 3. Sort products EXACTLY as in dashboard
    cat_priority = {
        'chaniya-choli': 1,
        'home-decor': 2,
        'cushion-covers': 3
    }

    def get_created_at_ts(p):
        val = p.get('created_at')
        if not val:
            return 0
        try:
            if isinstance(val, str):
                return datetime.fromisoformat(val.replace('Z', '+00:00')).timestamp()
            return float(val)
        except Exception:
            return 0

    indexed_filtered = list(enumerate(filtered_products))
    indexed_filtered.sort(key=lambda item: (
        cat_priority.get(item[1].get('category'), 99),
        -get_created_at_ts(item[1]),
        item[0]
    ))
    filtered_products = [item[1] for item in indexed_filtered]

    print(f"Total LIVE products from DB: {len(products)}")
    print(f"Active LIVE products after filtering 'Coming Soon': {len(filtered_products)}")

    doc = SimpleDocTemplate(
        pdf_output_path,
        pagesize=letter,
        leftMargin=0.35 * inch,
        rightMargin=0.35 * inch,
        topMargin=0.25 * inch,
        bottomMargin=0.25 * inch
    )

    styles = getSampleStyleSheet()

    # Custom Palette
    COLOR_MAROON = colors.HexColor('#6B0C20')
    COLOR_GOLD = colors.HexColor('#B8860B')
    COLOR_DARK_TEXT = colors.HexColor('#1F1F1F')
    COLOR_BORDER = colors.HexColor('#D4AF37')
    COLOR_LIGHT_BG = colors.HexColor('#FCFBF7')

    # Typography Styles
    title_style = ParagraphStyle(
        'CatalogTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=23,
        textColor=COLOR_MAROON,
        alignment=1,
        spaceAfter=1
    )

    subtitle_style = ParagraphStyle(
        'CatalogSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.0,
        leading=11,
        textColor=COLOR_GOLD,
        alignment=1,
        spaceAfter=4
    )

    cat_header_style = ParagraphStyle(
        'CategoryHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=colors.white,
        spaceAfter=0
    )

    prod_title_style = ParagraphStyle(
        'ProdTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=14.5,
        textColor=COLOR_MAROON,
        spaceAfter=2
    )

    code_tag_style = ParagraphStyle(
        'CodeTag',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_GOLD,
        spaceAfter=3
    )

    price_style = ParagraphStyle(
        'PriceStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=16,
        textColor=COLOR_MAROON,
        spaceAfter=4
    )

    section_hdr_style = ParagraphStyle(
        'SectionHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_MAROON,
        spaceBefore=3,
        spaceAfter=1
    )

    detail_text_style = ParagraphStyle(
        'DetailText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.0,
        leading=10.8,
        textColor=COLOR_DARK_TEXT,
        spaceAfter=2
    )

    video_style = ParagraphStyle(
        'VideoLink',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.0,
        leading=11.0,
        textColor=COLOR_MAROON,
        alignment=1,
        spaceBefore=3
    )

    elements = []

    # 1. Compact Page Header Banner
    elements.append(Paragraph("MAGIC THREADS", title_style))
    elements.append(Paragraph("PREMIUM HANDCRAFTED CHANIYA CHOLI & FESTIVE COLLECTION", subtitle_style))
    elements.append(Spacer(1, 3))

    categories = [
        ('chaniya-choli', 'Chaniya Choli & Lehenga'),
        ('home-decor', 'Ethnic Home Decor'),
        ('cushion-covers', 'Designer Cushion Covers')
    ]

    cards_on_current_page = 0
    resample_filter = getattr(PILImage, 'LANCZOS', getattr(PILImage, 'ANTIALIAS', 1))

    for cat_key, cat_label in categories:
        cat_items = [p for p in filtered_products if p.get('category') == cat_key]
        if not cat_items:
            continue

        # Category Header Banner
        header_table = Table(
            [[Paragraph(f"■ {cat_label}", cat_header_style)]],
            colWidths=[7.8 * inch]
        )
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), COLOR_MAROON),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        
        if cards_on_current_page == 2:
            elements.append(PageBreak())
            cards_on_current_page = 0

        elements.append(header_table)
        elements.append(Spacer(1, 4))

        for prod in cat_items:
            if cards_on_current_page == 2:
                elements.append(PageBreak())
                cards_on_current_page = 0
                elements.append(header_table)
                elements.append(Spacer(1, 4))

            # 1. Card Top Header Flowables
            card_top_flowables = []
            card_top_flowables.append(Paragraph(prod.get('name', 'Product Name'), prod_title_style))

            code_str = f"<b>Code:</b> {prod.get('id', '').upper()}"
            if prod.get('tag'):
                code_str += f" &nbsp;|&nbsp; <b>Tag:</b> {prod.get('tag')}"
            card_top_flowables.append(Paragraph(code_str, code_tag_style))

            # 2. Image Column Setup (Using ImageOps.pad with #FCFBF7 background)
            main_img_url = get_product_main_image(prod)
            img_path = resolve_image(main_img_url, prod.get('id'), project_dir, cache_dir)

            rl_img = None
            if img_path and os.path.exists(img_path):
                try:
                    pil_img = PILImage.open(img_path).convert('RGB')
                    padded_img = ImageOps.pad(pil_img, (500, 640), color=(252, 251, 247), method=resample_filter)
                    tmp_name = f"full_pad_{os.path.basename(img_path)}"
                    if not tmp_name.lower().endswith(('.jpg', '.jpeg')):
                        tmp_name += '.jpg'
                    tmp_img_path = os.path.join(cache_dir, tmp_name)
                    padded_img.save(tmp_img_path, 'JPEG', quality=95)
                    rl_img = RLImage(tmp_img_path, width=2.5 * inch, height=3.2 * inch)
                except Exception as e:
                    print(f"Error fitting main image {img_path}: {e}")

            if not rl_img:
                rl_img = Paragraph("Image Not Available", detail_text_style)

            image_flowables = [rl_img]

            # Clickable Product Video Link BELOW main image
            if prod.get('video'):
                vid_val = str(prod['video']).strip()
                if not (vid_val.startswith('http://') or vid_val.startswith('https://')):
                    vid_url = f"https://magicthreads.com{vid_val}"
                else:
                    vid_url = vid_val
                
                link_html = f'<a href="{vid_url}"><u><b><font color="#6B0C20">■ Click to Watch Product Video</font></b></u></a>'
                image_flowables.append(Spacer(1, 3))
                image_flowables.append(Paragraph(link_html, video_style))

            # 3. Details Flowables (Price + Specs)
            details_flowables = []

            # Price Prefix: INR
            price_val = prod.get('price', 0)
            try:
                price_int = int(round(float(price_val)))
                formatted_price = f"INR {price_int:,}"
            except Exception:
                formatted_price = f"INR {price_val}"
            details_flowables.append(Paragraph(formatted_price, price_style))

            # Detailed Specs Blocks
            lehenga_obj = prod.get('lehengaDetails')
            blouse_obj = prod.get('blouseDetails')
            dupatta_obj = prod.get('dupattaDetails')

            if lehenga_obj or blouse_obj or dupatta_obj:
                details_flowables.extend(build_section_flowables("LEHENGA DETAILS", lehenga_obj, section_hdr_style, detail_text_style))
                details_flowables.extend(build_section_flowables("BLOUSE DETAILS", blouse_obj, section_hdr_style, detail_text_style))
                details_flowables.extend(build_section_flowables("DUPATTA DETAILS", dupatta_obj, section_hdr_style, detail_text_style))
            else:
                details_flowables.append(Paragraph("<b>■ SPECIFICATIONS</b>", section_hdr_style))
                if prod.get('fabric'):
                    details_flowables.append(Paragraph(f"<b>Fabric:</b> {prod['fabric']}", detail_text_style))
                if prod.get('workType'):
                    details_flowables.append(Paragraph(f"<b>Work:</b> {prod['workType']}", detail_text_style))
                if prod.get('flare') and prod.get('flare') != 'N/A':
                    details_flowables.append(Paragraph(f"<b>Flare:</b> {prod['flare']}", detail_text_style))
                if prod.get('blouse') and prod.get('blouse') != 'N/A':
                    details_flowables.append(Paragraph(f"<b>Blouse:</b> {prod['blouse']}", detail_text_style))
                if prod.get('dupatta') and prod.get('dupatta') != 'N/A':
                    details_flowables.append(Paragraph(f"<b>Dupatta:</b> {prod['dupatta']}", detail_text_style))

            # 4. Standard Uniform Card Layout (Image on Left, Details on Right)
            card_table = Table(
                [
                    [card_top_flowables, ''],
                    [image_flowables, details_flowables]
                ],
                colWidths=[2.8 * inch, 5.0 * inch]
            )
            card_table.setStyle(TableStyle([
                ('SPAN', (0, 0), (1, 0)),
                ('BOX', (0,0), (-1,-1), 0.75, COLOR_BORDER),
                ('BACKGROUND', (0,0), (-1,-1), COLOR_LIGHT_BG),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ]))

            elements.append(KeepTogether([card_table, Spacer(1, 5)]))
            cards_on_current_page += 1

    # Build PDF
    doc.build(elements)
    print(f"Successfully generated PDF catalog with uniform left-image layout at: {pdf_output_path}")

if __name__ == '__main__':
    build_pdf()
