console.shared = new (class {
  // Gravitational constant
  G_G = 6.67428e-11;
  // Assumed scale: 100 pixels = 1AU.
  G_AU = 149.6e6 * 1000; //  149.6 million km; in meters
  G_SCALE = 75 / (149.6e6 * 1000);
  G_FRAME_MS = 13.333;
  G_MASS_MIN = 5.0 * 10 ** 30;
  G_MASS_MAX = 100.0 * 10 ** 30;

  G_R_LOBBY_CREATE = 'lc';
  G_R_LOBBY_JOIN = 'lj';
  G_R_LOBBY_LEAVE = 'll';
  G_R_LOBBY_START = 'ls';
  G_R_GAME_SET_ANGLE = 'ga';
  G_R_GAME_SHOOT = 'gs';
  G_R_GAME_PREV = 'gp';

  G_S_CONNECTED = '1';
  G_S_LOBBIES_UPDATED = '2';
  G_S_GAME_STARTED = '3';
  G_S_GAME_COMPLETED = '4';
  G_S_GAME_UPDATED = '5';
  G_S_GAME_COLLISIONS = '6';
  G_S_GAME_SET_ACTIVE_STATE = '7';
  G_S_GAME_ROUND_COMPLETED = '8';
  G_S_GAME_ROUND_STARTED = '9';
  G_S_GAME_PLAYER_DISCONNECTED = '10';

  normalize(x, A, B, C, D) {
    return C + ((x - A) * (D - C)) / (B - A);
  }
  dist(dx, dy) {
    return Math.sqrt(dx ** 2 + dy ** 2);
  }
  collidesCir(dx, dy, r1, r2) {
    return this.dist(dx, dy) <= r1 + r2;
  }
  toRadians(deg) {
    return (Math.PI * deg) / 180;
  }
  createCollision(self, other) {
    return [self.id, other?.id ?? ''];
  }
  isInBounds(x, y, width, height, gameData) {
    const { width: worldWidth, height: worldHeight } = gameData;
    return (
      x - width >= -worldWidth &&
      x + width <= worldWidth &&
      y - height >= -worldHeight &&
      y + height <= worldHeight
    );
  }
  getEntity(gameData, entityId) {
    return gameData.entityMap[entityId];
  }
  getHeadingTowards(myX, myY, x, y) {
    let lenY = y - myY;
    let lenX = x - myX;
    const { sqrt, asin } = Math;
    let hyp = sqrt(lenX * lenX + lenY * lenY);
    let ret = 0;
    if (y >= myY && x >= myX) {
      ret = (asin(lenY / hyp) * 180) / Math.PI + 90;
    } else if (y >= myY && x < myX) {
      ret = (asin(lenY / -hyp) * 180) / Math.PI - 90;
    } else if (y < myY && x > myX) {
      ret = (asin(lenY / hyp) * 180) / Math.PI + 90;
    } else {
      ret = (asin(-lenY / hyp) * 180) / Math.PI - 90;
    }
    if (ret >= 360) {
      ret = 360 - ret;
    }
    if (ret < 0) {
      ret = 360 + ret;
    }
    return isNaN(ret) ? 0 : ret;
  }
  fromPx(v) {
    return v / this.G_SCALE;
  }

  applyGravity(bodies, gravityBodies, extraColliders, dt) {
    const getAttraction = (self, other) => {
      let { x: sx, y: sy, mass: sMass, r: sr } = self;
      let { x: ox, y: oy, mass: oMass, r: or } = other;
      let dx = ox - sx;
      let dy = oy - sy;
      let d = Math.max(this.dist(dx, dy), 0.001);
      let c = extraColliders ? this.collidesCir(dx, dy, sr, or) : false;
      let f = (this.G_G * sMass * oMass) / d ** 2;
      let theta = Math.atan2(dy, dx);
      let fx = Math.cos(theta) * f;
      let fy = Math.sin(theta) * f;
      return { fx, fy, c };
    };

    let collisions = [];
    let timeStep = (24 * 3600 * 2 * dt) / this.G_FRAME_MS; // two days / G_FRAME_MS
    for (let i = 0; i < bodies.length; i++) {
      let body = bodies[i];
      body.mark = true;
      let totalFx = 0,
        totalFy = 0;
      for (let j = 0; j < gravityBodies.length; j++) {
        let other = gravityBodies[j];
        if (body === other) {
          continue;
        }
        let { fx, fy, c } = getAttraction(body, other);
        if (c) {
          const col = this.createCollision(body, other);
          collisions.push(col);
          continue;
        }
        totalFx += fx;
        totalFy += fy;
      }

      if (extraColliders) {
        for (let j = 0; j < extraColliders.length; j++) {
          let other = extraColliders[j];
          let { x, y, r, removed } = other;
          if (removed) {
            continue;
          }
          let c = this.collidesCir(x - body.x, y - body.y, r, body.r);
          if (c) {
            const col = this.createCollision(body, other);
            collisions.push(col);
          }
        }
      }

      body.vx +=
        (totalFx / body.mass) * timeStep + (body.ax * dt) / this.G_FRAME_MS;
      body.vy +=
        (totalFy / body.mass) * timeStep + (body.ay * dt) / this.G_FRAME_MS;
      body.x += body.vx * timeStep;
      body.y += body.vy * timeStep;
    }
    return collisions;
  }

  simulate(gameData, { nowDt }) {
    let currentGameData = gameData;
    let { projectiles, planets, players, resources, fields } = currentGameData;
    let collisionCallbacks = [];

    const bodiesAffectedByGravityBodies = gameData.players
      .map(id => this.getEntity(gameData, id))
      .filter(p => p.active);
    const gravityBodies = gameData.planets.map(id =>
      this.getEntity(gameData, id)
    );
    const gravityCollidables = gameData.flags
      .concat(gameData.coins)
      .map(id => this.getEntity(gameData, id));

    gameData.collisions = this.applyGravity(
      bodiesAffectedByGravityBodies,
      gravityBodies,
      gravityCollidables,
      nowDt
    );

    bodiesAffectedByGravityBodies.forEach(p => {
      if (!this.isInBounds(p.x, p.y, p.r, p.r, currentGameData)) {
        const c = this.createCollision(p, '');
        gameData.collisions.push(c);
      }
    });
  }
})();
