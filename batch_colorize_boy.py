import os
import glob
# pyrefly: ignore[missing-import]
import cv2
import numpy as np
from PIL import Image

def colorize_frame(im):
    out = im.copy()
    gray = cv2.cvtColor(cv2.cvtColor(im, cv2.COLOR_BGRA2BGR), cv2.COLOR_BGR2GRAY)
    a = im[:,:,3] > 0
    h, w = gray.shape
    y_coords = np.arange(h)[:, None]
    x_coords = np.arange(w)

    # Brand Colors
    sky_blue_bgr = np.array([224, 154, 0], dtype=float)  # Sky Blue (#009ae0 / Ethyra Cyan)
    dark_blue_bgr = np.array([139, 44, 0], dtype=np.uint8) # Dark Navy (#002c8b)
    pure_white = np.array([255, 255, 255], dtype=np.uint8)

    # Barrier for morphological / flood operations
    barrier = ((gray < 40) | (~a)).astype(np.uint8) * 255
    barrier_closed = cv2.morphologyEx(barrier, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))

    # ==========================================
    # 1. CAP (Dome + Visor)
    # ==========================================
    y_top = np.where(a & (y_coords < 170))[0].min()

    # Find cap domain in y_top <= y < y_top + 100
    cap_domain = (barrier_closed == 0) & (y_coords >= y_top) & (y_coords < y_top + 100) & a
    num_l_cap, l_cap, stats_cap, cent_cap = cv2.connectedComponentsWithStats(cap_domain.astype(np.uint8))

    cap_mask = np.zeros((h, w), dtype=bool)
    for i in range(1, num_l_cap):
        area = stats_cap[i][4]
        cx, cy = cent_cap[i]
        # Cap dome and visor: area > 100, above the forehead (cy < y_top + 75)
        # Avoid the face/forehead: forehead starts below the curved brim/seam
        if area > 100 and cy < y_top + 75 and cx > 240:
            cap_mask |= (l_cap == i)

    # Keep black line art intact
    cap_mask &= (gray > 30) & a

    # Apply halftone-preserving sky blue
    gray_norm = gray[cap_mask, None].astype(float) / 255.0
    out[cap_mask, :3] = np.clip(sky_blue_bgr * gray_norm, 0, 255).astype(np.uint8)

    # ==========================================
    # 2. SHIRT (Sky Blue with pure white flowers)
    # ==========================================
    # Shirt body is between y 145 and 430, gray between 50 and 205
    shirt_mask = a & (y_coords >= 145) & (y_coords <= 430) & (gray >= 50) & (gray <= 205)
    out[shirt_mask, :3] = [224, 154, 0]

    # White flowers inside the shirt
    flower_mask = a & (y_coords >= 150) & (y_coords <= 420) & (gray >= 235) & (x_coords < 360)
    out[flower_mask, :3] = pure_white

    # ==========================================
    # 3. SHORTS (Dark Blue)
    # ==========================================
    # Shorts are between y 330 and 540, gray between 200 and 245
    shorts_mask = a & (y_coords >= 330) & (y_coords <= 540) & (gray >= 200) & (gray <= 245)
    out[shorts_mask, :3] = dark_blue_bgr

    # ==========================================
    # 4. SHOES (Sky Blue upper & toe, white sole, black swoosh)
    # ==========================================
    mask_foot = (barrier_closed == 0) & (y_coords >= 550) & a
    num_l_foot, l_foot, stats_foot, cent_foot = cv2.connectedComponentsWithStats(mask_foot.astype(np.uint8))

    for i in range(1, num_l_foot):
        area = stats_foot[i][4]
        if area > 80:
            cx, cy = cent_foot[i]
            y_max = stats_foot[i][1] + stats_foot[i][3]
            dark_frac = np.mean(gray[l_foot == i] < 230)

            # Socks: halftone dots (dark_frac >= 0.75)
            is_sock = dark_frac >= 0.75
            # Leg skin: smooth white skin above y=575
            is_leg = (cy < 575) and (dark_frac < 0.15)
            # Sole: bottom rubber band
            is_sole = (y_max >= 658) and (cy >= 648)

            if not is_sock and not is_leg and not is_sole and cy >= 580:
                out[l_foot == i, :3] = [224, 154, 0]

    return out

def main():
    frame_files = sorted(glob.glob(r'exact-ethyra-site-code\assets\boy_push\frame_*.png'))
    print(f"Found {len(frame_files)} frames to colorize.")

    colorized_imgs = []
    for idx, fpath in enumerate(frame_files):
        im = cv2.imread(fpath, cv2.IMREAD_UNCHANGED)
        col = colorize_frame(im)
        cv2.imwrite(fpath, col) # Overwrite frame with colorized version
        colorized_imgs.append(col)
        print(f"Processed and saved {os.path.basename(fpath)}")

    # 1. Compile Spritesheet
    h, w = colorized_imgs[0].shape[:2]
    sheet = np.zeros((h, w * len(colorized_imgs), 4), dtype=np.uint8)
    for i, im in enumerate(colorized_imgs):
        sheet[:, i*w : (i+1)*w] = im

    cv2.imwrite(r'exact-ethyra-site-code\assets\boy-push-sheet.png', sheet)
    cv2.imwrite(r'img\boy-push-sheet.png', sheet)
    print("Saved boy-push-sheet.png")

    # 2. Compile Animated WebP (duration=85ms per frame, lossless, infinite loop)
    pil_frames = [Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA)) for im in colorized_imgs]
    
    webp_path1 = r'exact-ethyra-site-code\assets\boy-push.webp'
    webp_path2 = r'img\boy-push.webp'

    pil_frames[0].save(
        webp_path1,
        format='WEBP',
        save_all=True,
        append_images=pil_frames[1:],
        duration=85,
        loop=0,
        lossless=True,
        quality=100,
        method=6
    )
    pil_frames[0].save(
        webp_path2,
        format='WEBP',
        save_all=True,
        append_images=pil_frames[1:],
        duration=85,
        loop=0,
        lossless=True,
        quality=100,
        method=6
    )
    print("Saved animated boy-push.webp in assets and img directories.")

    # 3. Create full-body comparison tile of frames 00, 03, 06, 09 for visual verification
    vis_frames = [colorized_imgs[0], colorized_imgs[3], colorized_imgs[6], colorized_imgs[9]]
    # Composite each on white background
    comp_list = []
    for im in vis_frames:
        bg = np.full_like(im[:,:,:3], 255)
        alpha = im[:,:,3:4] / 255.0
        comp_frame = (im[:,:,:3] * alpha + bg * (1.0 - alpha)).astype(np.uint8)
        comp_list.append(comp_frame)
    
    verification_tile = np.hstack(comp_list)
    cv2.imwrite('verification_full_boy_tile.png', verification_tile)
    print("Saved verification_full_boy_tile.png")

if __name__ == '__main__':
    main()
