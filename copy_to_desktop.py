import os
import shutil

desktops = [
    r'C:\Users\jaszz\OneDrive\Desktop',
    os.path.join(os.environ.get('USERPROFILE', r'C:\Users\jaszz'), 'Desktop')
]

files = [
    ('Genomics_Atlas.bat', 'Genomics_Atlas.bat'),
    ('Genomics_Atlas.bat', 'Genomics_to_Precision_Medicine_Atlas.bat'),
    ('Genomics_Atlas.sh', 'Genomics_Atlas.sh'),
]

for d in desktops:
    if not os.path.exists(d):
        try:
            os.makedirs(d, exist_ok=True)
        except Exception:
            continue
    print(f"\nCopying to desktop directory: {d}")
    for src, dst in files:
        src_path = os.path.join(r'D:\Genomics', src)
        dst_path = os.path.join(d, dst)
        try:
            shutil.copyfile(src_path, dst_path)
            print(f"  [OK] Copied {src} -> {dst_path} ({os.path.getsize(dst_path)} bytes)")
        except Exception as e:
            print(f"  [ERR] {src} -> {dst_path}: {e}")
