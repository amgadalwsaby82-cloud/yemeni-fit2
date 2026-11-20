YEMENI FIT — local setup

Files:
  index.html
  style.css
  script.js
  assets/models/yemeni-male-avatar.glb (optional model slot)
  assets/tshirts/
  assets/pants/
  assets/textures/fabrics/

Run:
1. Install Visual Studio Code (or another editor).
2. Open the yemeni_fit folder.
3. In VS Code, install the Live Server extension.
4. Right-click index.html > Open with Live Server.
5. Keep an internet connection: Three.js, GSAP, and Google Fonts load from CDNs.

Important implementation note:
This starter is a working interactive 3D showroom with procedural 3D garments and a
procedural mannequin fallback. No GLB avatar or rigged garment files were supplied,
so it does NOT claim photorealistic Yemeni identity, skeletal animation, cloth simulation,
or physically accurate virtual try-on. Add a properly licensed, rigged Yemeni male
avatar at assets/models/yemeni-male-avatar.glb. For real fitting, add garments skinned
to the same skeleton and update the GLB-loading/fitting integration in script.js.

Checkout is a front-end demo only. No real payment or order backend is connected.
