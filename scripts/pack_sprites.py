#!/usr/bin/env python3
"""Pack character sprite frames into one atlas per character.

Output: public/assets/sprites/<id>/sheet.png + sheet.json

sheet.json:
  cell     [w, h] size of one frame cell in px
  cols     cells per row
  foot     [x, y] feet anchor inside a cell, normalized (0..1, y down)
  charPx   character height in px (top of head to feet) for scaling
  anims    { name: { frames: [cell index...], fps, loop } }
           names are <state>_<dir>; dir is s, se, e, ne, n, nw, w, sw.
           A missing direction is mirrored from its opposite (e <-> w) by the engine.

Usage: python3 scripts/pack_sprites.py <source-root>
  <source-root>/yera/yera-v3_r<row>_c<col>.png     (6x6 grid, old repo "yera-v3")
  <source-root>/tami/tami-*.png                    (horizontal strips)
  <source-root>/tami/samael-idle-<dir>.png         (horizontal strips, 256 px)
Requires Pillow.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'sprites')


def strip(path, w):
    im = Image.open(path).convert('RGBA')
    return [im.crop((i * w, 0, (i + 1) * w, im.height)) for i in range(im.width // w)]


def bbox_stats(frames):
    bottoms, tops, centers = [], [], []
    for f in frames:
        a = f.getchannel('A').point(lambda v: 255 if v > 40 else 0)
        bb = a.getbbox()
        if not bb:
            continue
        bottoms.append(bb[3])
        tops.append(bb[1])
        # horizontal centre of the lowest 10% of the figure (the feet)
        h = bb[3] - bb[1]
        feet = a.crop((0, bb[3] - max(2, h // 10), f.width, bb[3])).getbbox()
        if feet:
            centers.append((feet[0] + feet[2]) / 2)
    med = lambda xs: sorted(xs)[len(xs) // 2]
    return med(bottoms), med(tops), med(centers) if centers else frames[0].width / 2


def pack(cid, groups, fps, foot_x=None, extra=None):
    """groups: list of (anim name, [frames]); frames are PIL images of the same size."""
    cells = []
    anims = {}
    for name, frames in groups:
        idx = []
        for f in frames:
            idx.append(len(cells))
            cells.append(f)
        anims[name] = {'frames': idx, 'fps': fps.get(name.split('_')[0], 8), 'loop': True}
    for name, spec in (extra or {}).items():
        base = anims[spec['from']]['frames']
        anims[name] = {'frames': [base[i] for i in spec['pick']], 'fps': spec.get('fps', 4), 'loop': spec.get('loop', True)}
    w, h = cells[0].size
    cols = min(len(cells), max(1, 4096 // w))
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * w, rows * h), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        sheet.paste(c, ((i % cols) * w, (i // cols) * h))
    bottom, top, cx = bbox_stats([cells[i] for i in anims[groups[0][0]]['frames']])
    out = os.path.join(ROOT, cid)
    os.makedirs(out, exist_ok=True)
    sheet.save(os.path.join(out, 'sheet.png'), optimize=True)
    meta = {
        'cell': [w, h],
        'cols': cols,
        'foot': [round((foot_x if foot_x is not None else cx) / w, 4), round(bottom / h, 4)],
        'charPx': bottom - top,
        'anims': anims,
    }
    with open(os.path.join(out, 'sheet.json'), 'w') as fh:
        json.dump(meta, fh, indent=1)
    print(cid, sheet.size, len(cells), 'frames', meta['foot'], meta['charPx'])


def main(src):
    # Yera: rows 0 front idle, 1 back idle, 2 side walk (faces left), 3 actions, 4 front walk, 5 back walk
    yg = lambda r: [Image.open(os.path.join(src, 'yera', f'yera-v3_r{r}_c{c}.png')).convert('RGBA') for c in range(6)]
    rows = [yg(r) for r in range(6)]
    pack(
        'yera',
        [
            ('walk_s', rows[4]),
            ('walk_n', rows[5]),
            ('walk_w', rows[2]),
            ('idlerow_s', rows[0]),
            ('idle_n', rows[1][:1]),
            ('act_s', rows[3]),
        ],
        {'walk': 9, 'idlerow': 2, 'idle': 1, 'act': 1},
        extra={
            'idle_s': {'from': 'idlerow_s', 'pick': [0, 0, 0, 0, 0, 3, 0, 0, 5, 5], 'fps': 2.5},
            'happy_s': {'from': 'idlerow_s', 'pick': [2, 1], 'fps': 1.5},
            'idle_w': {'from': 'walk_w', 'pick': [0], 'fps': 1},
            'point_s': {'from': 'act_s', 'pick': [0], 'fps': 1},
            'cast_s': {'from': 'act_s', 'pick': [1], 'fps': 1},
            'talk_s': {'from': 'act_s', 'pick': [2, 4], 'fps': 1.2},
            'cheer_s': {'from': 'act_s', 'pick': [3], 'fps': 1},
            'kneel_s': {'from': 'act_s', 'pick': [5], 'fps': 1},
        },
    )

    t = os.path.join(src, 'tami')
    pack(
        'tami',
        [
            ('idle_s', strip(os.path.join(t, 'tami-idle.png'), 313)),
            ('walk_s', strip(os.path.join(t, 'tami-walk-down.png'), 313)),
            ('walk_e', strip(os.path.join(t, 'tami-walk-right.png'), 313)),
            ('walk_se', strip(os.path.join(t, 'tami-walk-down-right.png'), 313)),
            ('walk_ne', strip(os.path.join(t, 'tami-walk-up-right.png'), 313)),
            ('walk_n', strip(os.path.join(t, 'tami-walk-up.png'), 313)),
        ],
        {'idle': 4, 'walk': 10},
        extra={
            'idle_e': {'from': 'walk_e', 'pick': [0], 'fps': 1},
            'idle_se': {'from': 'walk_se', 'pick': [0], 'fps': 1},
            'idle_ne': {'from': 'walk_ne', 'pick': [0], 'fps': 1},
            'idle_n': {'from': 'walk_n', 'pick': [0], 'fps': 1},
        },
    )

    dirs = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']
    pack(
        'samael',
        [(f'idle_{d}', strip(os.path.join(t, f'samael-idle-{d}.png'), 256)) for d in dirs],
        {'idle': 8},
        extra={f'walk_{d}': {'from': f'idle_{d}', 'pick': list(range(12)), 'fps': 12} for d in dirs},
    )


if __name__ == '__main__':
    main(sys.argv[1])
