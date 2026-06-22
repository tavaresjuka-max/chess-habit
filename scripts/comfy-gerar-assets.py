"""
Gera todos os emblemas/selos/medalhas/bandas via ComfyUI local (DreamShaper XL Lightning).
Remove fundo via flood-fill (threshold 200) e salva PNGs em entrega/.
Depois rodar: node scripts/aparar-selos.mjs

Uso:
  python scripts/comfy-gerar-assets.py              # todos
  python scripts/comfy-gerar-assets.py --only=selo-ritmo
  python scripts/comfy-gerar-assets.py --rest       # pula os que ja tem em entrega/
"""
import json, urllib.request, time, random, sys, os, shutil
from pathlib import Path
from PIL import Image
from collections import deque

COMFY_URL = "http://127.0.0.1:8188"
MODEL = "dreamshaper_xl_lightning.safetensors"
COMFY_OUTPUT = Path("C:/AI/ComfyUI_windows_portable/ComfyUI/output")
ENTREGA = Path("entrega")
WHITE_THRESHOLD = 200  # flood-fill: remove background conectado as bordas

PROMPT_POS_BASE = (
    "{subject}, antique vintage engraving illustration, isolated sticker, "
    "centered on solid pure white background, no shadow no gradient, "
    "warm antique gold color, detailed ink engraving, ornate vintage style, "
    "single object, masterpiece"
)
PROMPT_NEG = (
    "(frame:1.8), (border:1.8), (circle around:1.5), "
    "(gray background:1.8), (gradient:1.8), (vignette:1.5), (shadow:1.5), "
    "parchment, cream, sepia background, colored background, "
    "text, numbers, watermark, 3d render, photographic, neon, multiple objects, busy"
)

# (nome, sujeito)
ASSETS = [
    # Selos de secao
    ("selo-ritmo",        "gold metronome pendulum"),
    ("selo-plano",        "gold rolled map scroll"),
    ("selo-diagnostico",  "gold magnifying glass"),
    ("selo-avaliacao",    "gold balance scale of justice"),
    ("selo-conquistas",   "gold laurel-wreathed trophy cup"),
    ("selo-dados",        "gold ascending bar chart three bars"),
    ("selo-essencial",    "gold ornate antique key with large round bow handle"),
    ("selo-habilidades",  "gold concentric bullseye archery target"),
    ("selo-lichess",      "gold chess knight piece"),
    ("selo-linha-base",   "gold stack of three stone foundation blocks"),
    ("selo-pendencias",   "gold hourglass sand timer"),
    ("selo-registro",     "gold open book"),
    ("selo-sessao",       "gold pocket watch"),
    ("selo-trava",        "gold closed padlock"),
    ("selo-trilha",       "gold triangular pennant flag on pole"),
    ("selo-metas",        "gold flag planted on mountain summit peak"),
    # Pecas de xadrez (diplomas)
    ("selo-cera-peao",    "gold chess pawn piece, Staunton style"),
    ("selo-cera-torre",   "gold chess rook piece, Staunton style, wide base"),
    ("selo-cera-rei",     "gold chess king piece, Staunton style, tallest piece with cross on top"),
    # Decorativos
    ("selo-cera-cavalo",  "gold chess knight horse piece, Staunton style"),
    ("selo-cera-louro",   "gold laurel wreath victory crown"),
    # Medalhas de conquista
    ("medalha-calibrado",         "gold award medal hanging on ribbon, bullseye target engraved on medal"),
    ("medalha-primeira-hora",     "gold award medal hanging on ribbon, hourglass engraved on medal"),
    ("medalha-retorno-de-ouro",   "gold award medal hanging on ribbon, five-pointed star engraved on medal"),
    ("medalha-semana-inteira",    "gold award medal hanging on ribbon, laurel wreath engraved on medal"),
    ("medalha-tratador-pendencias","gold award medal hanging on ribbon, checkmark engraved on medal"),
    # Bandas (tomos com peca em relevo)
    ("banda-1", "closed antique leather tome book standing upright, chess pawn embossed on cover, gold and brown"),
    ("banda-2", "closed antique leather tome book standing upright, chess knight embossed on cover, gold and brown"),
    ("banda-3", "closed antique leather tome book standing upright, chess bishop embossed on cover, gold and brown"),
    ("banda-4", "closed antique leather tome book standing upright, chess rook embossed on cover, gold and brown"),
    ("banda-5", "closed antique leather tome book standing upright, chess queen embossed on cover, gold and brown"),
    ("banda-6", "closed antique leather tome book standing upright, chess king embossed on cover, gold and brown"),
    ("banda-7", "closed antique leather tome book standing upright, crowned chess king with laurel embossed on cover, gold and brown"),
]


def defundo(img: Image.Image, threshold: int = WHITE_THRESHOLD) -> Image.Image:
    """Remove fundo claro conectado as bordas via flood-fill."""
    rgba = img.convert("RGBA")
    data = rgba.load()
    w, h = rgba.size
    visited = [[False] * h for _ in range(w)]
    queue = deque()

    def is_light(px):
        r, g, b, _ = px
        return r >= threshold and g >= threshold and b >= threshold

    def enqueue(x, y):
        if 0 <= x < w and 0 <= y < h and not visited[x][y] and is_light(data[x, y]):
            visited[x][y] = True
            queue.append((x, y))

    # Semente: todas as bordas
    for x in range(w):
        enqueue(x, 0); enqueue(x, h - 1)
    for y in range(h):
        enqueue(0, y); enqueue(w - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = data[x, y]
        data[x, y] = (r, g, b, 0)
        enqueue(x - 1, y); enqueue(x + 1, y)
        enqueue(x, y - 1); enqueue(x, y + 1)

    return rgba


def submit_workflow(name: str, subject: str) -> str:
    prompt_pos = PROMPT_POS_BASE.format(subject=subject)
    workflow = {
        "prompt": {
            "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": MODEL}},
            "2": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": prompt_pos}},
            "3": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["1", 1], "text": PROMPT_NEG}},
            "4": {"class_type": "EmptyLatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
            "5": {"class_type": "KSampler", "inputs": {
                "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0],
                "latent_image": ["4", 0],
                "seed": random.randint(0, 2**32),
                "steps": 8, "cfg": 2.0,
                "sampler_name": "euler", "scheduler": "sgm_uniform", "denoise": 1.0,
            }},
            "6": {"class_type": "VAEDecode", "inputs": {"samples": ["5", 0], "vae": ["1", 2]}},
            "7": {"class_type": "SaveImage", "inputs": {"images": ["6", 0], "filename_prefix": f"comfy_{name}"}},
        }
    }
    data = json.dumps({"prompt": workflow["prompt"]}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data,
                                  headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req).read())
    return resp["prompt_id"]


def wait_for(pid: str, timeout: int = 120) -> str | None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        time.sleep(2)
        hist = json.loads(urllib.request.urlopen(f"{COMFY_URL}/history/{pid}").read())
        if pid in hist:
            for _, out in hist[pid].get("outputs", {}).items():
                for img in out.get("images", []):
                    return img["filename"]
    return None


def process(name: str, subject: str) -> bool:
    print(f"\n> {name}  [{subject[:50]}]")
    pid = submit_workflow(name, subject)

    filename = wait_for(pid)
    if not filename:
        print(f"  ERRO: timeout")
        return False

    src = COMFY_OUTPUT / filename
    if not src.exists():
        # Tenta encontrar pelo prefixo
        candidates = list(COMFY_OUTPUT.glob(f"comfy_{name}_*.png"))
        if not candidates:
            print(f"  ERRO: arquivo nao encontrado: {src}")
            return False
        src = max(candidates, key=lambda p: p.stat().st_mtime)

    img = Image.open(src)
    img_clean = defundo(img)

    out = ENTREGA / f"{name}.png"
    img_clean.save(out, "PNG")
    kb = out.stat().st_size // 1024
    print(f"  OK {out}  {kb} KB  (transparente)")
    return True


def main():
    args = sys.argv[1:]
    only = next((a[7:] for a in args if a.startswith("--only=")), None)
    rest = "--rest" in args

    ENTREGA.mkdir(exist_ok=True)

    targets = ASSETS
    if only:
        targets = [a for a in ASSETS if a[0] == only]
        if not targets:
            names = ", ".join(a[0] for a in ASSETS)
            print(f"Nome '{only}' nao encontrado. Opcoes:\n{names}")
            sys.exit(1)
    elif rest:
        targets = [a for a in ASSETS if not (ENTREGA / f"{a[0]}.png").exists()]
        print(f"--rest: {len(targets)} assets faltando")

    print(f"Gerando {len(targets)} assets via ComfyUI ({MODEL})\n")
    ok = 0
    for name, subject in targets:
        try:
            if process(name, subject):
                ok += 1
        except Exception as e:
            print(f"  ERRO {name}: {e}")

    print(f"\n{'='*50}")
    print(f"Pronto: {ok}/{len(targets)} assets em entrega/")
    print("Proximo passo: node scripts/aparar-selos.mjs")


if __name__ == "__main__":
    main()
