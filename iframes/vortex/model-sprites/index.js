import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';
import { Animation } from './animation.js';

let app = null;

window.handleShowPlaneClick = elem => {
  if (app) {
    app.plane.visible = elem.checked;
  }
};

window.handleResetCameraClick = () => {
  if (app) {
    app.resetCameraPosition();
  }
};

window.handleGenerateClick = () => {
  const spriteWidth = Number(document.getElementById('width')?.value);
  const spriteHeight = Number(document.getElementById('height')?.value);
  const spriteFrames = Number(document.getElementById('frames')?.value);
  const frameMs = Number(document.getElementById('frameDuration')?.value);

  if (app) {
    app.generateSprites(spriteFrames, frameMs, spriteWidth, spriteHeight);
  }
};

window.handleSpriteScaleChange = elem => {
  if (app) {
    app.spriteScale = elem.value;
  }
};

window.handleRotAxisChange = elem => {
  if (app) {
    app.pivot.rotation.set(0, 0, 0);
    app.rotAxis = elem.value;
  }
};

window.handleRotAxisDirectionClick = elem => {
  if (app) {
    app.rotReverse = elem.checked;
  }
};

window.handleHideSpritesheetClick = () => {
  if (app) {
    app.animation = null;
    app.canvas.style.display = 'block';
    const cc = document.getElementById('cc');
    if (cc) {
      cc.style.display = 'none';
    }
    const spritesheet = document.getElementById('spritesheet');
    if (spritesheet) {
      spritesheet.style.display = 'none';
    }
  }
};

class App {
  constructor() {
    const parsedUrl = new URL(location.href);

    this.canvas = document.querySelector('#c');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    this.model = null;
    this.pivot = null;
    this.modelName = parsedUrl.searchParams.get('model') ?? 'player_ship';
    this.fov = 45;
    this.aspect = 1; // the canvas default
    this.near = 0.1;
    this.far = 100;
    this.defaultCameraPosition = [0, 10, 10];
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
    this.rotAxis = 'y';
    this.rotReverse = false;

    this.sprites = null;
    this.spriteScale = 1;

    const controls = new OrbitControls(this.camera, this.canvas);
    controls.target.set(0, 5, 0);
    controls.keys = {
      LEFT: 'ArrowLeft', //left arrow
      UP: 'ArrowUp', // up arrow
      RIGHT: 'ArrowRight', // right arrow
      BOTTOM: 'ArrowDown', // down arrow
    };
    controls.update();

    this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color('transparent');

    {
      const planeSize = 40;

      const loader = new THREE.TextureLoader();
      const texture = loader.load(
        'https://threejsfundamentals.org/threejs/resources/images/checker.png'
      );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.magFilter = THREE.NearestFilter;
      const repeats = planeSize / 2;
      texture.repeat.set(repeats, repeats);

      const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
      const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(planeGeo, planeMat);
      mesh.rotation.x = Math.PI * -0.5;
      this.plane = mesh;
      mesh.visible = false;
      this.scene.add(mesh);
    }

    {
      const skyColor = 0xb1e1ff; // light blue
      const groundColor = 0xb97a20; // brownish orange
      const intensity = 1;
      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
      this.scene.add(light);
    }

    {
      const color = 0xffffff;
      const intensity = 0.5;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...this.defaultCameraPosition);
      this.scene.add(light);
      this.scene.add(light.target);
    }

    const gltfLoader = new GLTFLoader();
    const url = `models/${this.modelName}.glb`;
    gltfLoader.load(
      url,
      loadedModel => {
        const root = loadedModel.scene;
        this.scene.add(root);
        this.model = root;
        // root.rotation.set(59, 20, 28);
        // root.rotation.set(0, 0, 2.1);

        const box = new THREE.Box3().setFromObject(root);
        let boxSize = (this.boxSize = box
          .getSize(new THREE.Vector3())
          .length());
        const boxCenter = (this.boxCenter = box.getCenter(new THREE.Vector3()));

        // boxSize = this.boxSize = 71.30918594402827;
        // this.boxCenter.set(0, 0.8777482279544735, 2.5000002179639544);

        this.setCameraToFrameArea(
          boxSize * 1.2,
          boxSize,
          boxCenter,
          this.camera
        );
        console.log(
          'SET CAMERA TO FRAME AREA',
          boxSize,
          boxCenter,
          this.camera
        );

        this.pivot = new THREE.Group();
        this.scene.add(this.pivot);
        this.pivot.add(root);

        // update the Trackball controls to handle the new size
        controls.maxDistance = boxSize * 10;
        controls.target.copy(boxCenter);
        controls.update();

        this.resetCameraPosition();

        this.loop();
      },
      undefined,
      err => {
        console.error('Error Loading Model', err);
        document.body.innerHTML =
          '<div style="margin:32px">ERROR: ' +
          url +
          ' ' +
          err.target.statusText +
          '</div>';
      }
    );
  }

  resetCameraPosition() {
    this.camera.position.set(...this.defaultCameraPosition);
    this.setCameraToFrameArea(
      this.boxSize * 1.2,
      this.boxSize,
      this.boxCenter,
      this.camera
    );
  }

  setCameraToFrameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // from the center of the box
    const direction = new THREE.Vector3()
      .subVectors(camera.position, boxCenter)
      .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  async generateSprites(frames, frameMs, width, height) {
    await this.stopLoop();
    this.pivot.rotation.y = 0;

    const PI2 = 2 * Math.PI;
    const sprites = [];

    let angle = 0;
    for (let j = 0; j < frames; j++) {
      this.pivot.rotation[this.rotAxis] = angle * (this.rotReverse ? 1 : -1);
      this.renderer.render(this.scene, this.camera);

      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = width;
      spriteCanvas.height = height;
      spriteCanvas.imageSmoothingEnabled = false;
      const ctx = spriteCanvas.getContext('2d');
      ctx.drawImage(
        this.canvas,
        0,
        0,
        this.canvas.width,
        this.canvas.height,
        0,
        0,
        width,
        height
      );
      sprites.push(spriteCanvas);
      angle += PI2 / frames;
    }

    this.sprites = sprites;

    const oldSpritesheet = document.getElementById('spritesheet');
    if (oldSpritesheet) {
      oldSpritesheet.remove();
    }

    const numSpritesWide = Math.ceil(Math.sqrt(sprites.length));
    const numSpritesTall = Math.ceil(sprites.length / numSpritesWide);
    const spriteSheetCanvas = document.createElement('canvas');
    spriteSheetCanvas.id = 'spritesheet';
    spriteSheetCanvas.width = width * numSpritesWide;
    spriteSheetCanvas.height = height * numSpritesTall;
    spriteSheetCanvas.imageSmoothingEnabled = false;
    const ctx = spriteSheetCanvas.getContext('2d');
    sprites.forEach((spriteCanvas, i) => {
      ctx.drawImage(
        spriteCanvas,
        (i % numSpritesWide) * width,
        Math.floor(i / numSpritesWide) * height
      );
    });
    const main = document.getElementById('main');
    if (main) {
      main.appendChild(spriteSheetCanvas);
    }

    this.animation = new Animation(true, {
      getCurrentTime: () => {
        return { now: this.now };
      },
    });
    sprites.forEach((_, i) => {
      this.animation.addSprite({
        name: i,
        duration: frameMs,
        offsetX: 0,
        offsetY: 0,
        opacity: 1,
      });
    });
    this.animation.start();

    const cc = document.getElementById('cc');
    cc.style.display = 'block';
    cc.imageSmoothingEnabled = false;

    this.canvas.style.display = 'none';
    this.loop();
  }

  async stopLoop() {
    this.looping = false;
    return new Promise(resolve => {
      setTimeout(resolve, 33);
    });
  }

  loop() {
    const startTime = performance.now();
    let prevNow = startTime;
    const sixtyFpsMs = 16;

    let ctr = 0;

    this.looping = true;
    const render = now => {
      if (!this.looping) {
        return false;
      } else {
        requestAnimationFrame(render);
      }

      this.now = now;
      const dt = now - prevNow;
      const frameMult = dt / sixtyFpsMs;
      prevNow = now;
      // ctr++;
      // if (ctr === 100) {
      //   ctr = 0;
      //   console.log('FRAME MULT', frameMult, dt, 1000 / dt);
      // }

      if (this.animation) {
        this.animation.update();
        const sprite = this.sprites[this.animation.getSprite()];
        const animCanvas = document.getElementById('cc');
        const ctx = animCanvas.getContext('2d');
        ctx.clearRect(0, 0, animCanvas.width, animCanvas.height);
        // ctr++;
        // if (ctr === 10) {
        //   console.log('SPRITE', this.animation.getSprite());
        //   ctr = 0;
        // }
        if (sprite) {
          const w = sprite.width * this.spriteScale;
          const h = sprite.height * this.spriteScale;
          ctx.drawImage(
            sprite,
            0,
            0,
            sprite.width,
            sprite.height,
            animCanvas.width / 2 - w / 2,
            animCanvas.height / 2 - h / 2,
            w,
            h
          );
        }
      } else {
        if (this.resizeRendererToDisplaySize(this.renderer)) {
          const canvas = this.renderer.domElement;
          this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
          this.camera.updateProjectionMatrix();
        }

        this.renderer.render(this.scene, this.camera);

        if (this.pivot) {
          this.pivot.rotation[this.rotAxis] +=
            (this.rotReverse ? 1 : -1) * 0.02 * frameMult;
        }
      }
    };

    requestAnimationFrame(render);
  }
}

function main() {
  app = window.app = new App();
}

main();
