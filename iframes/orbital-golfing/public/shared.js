console.shared = new (class {
  // Gravitational constant
  G_G = 6.67428e-11;
  // Assumed scale: 100 pixels = 1AU.
  G_AU = 149.6e6 * 1000; //  149.6 million km; in meters
  G_SCALE = 75 / (149.6e6 * 1000);
  G_FRAME_MS = 13.333;
  G_MASS_MIN = 5.0 * 10 ** 30;
  G_MASS_MAX = 100.0 * 10 ** 30;

  G_R_LOBBY_CREATE = 'lobby-create';
  G_R_LOBBY_JOIN = 'lobby-join';
  G_R_LOBBY_LEAVE = 'lobby-leave';
  G_R_LOBBY_START = 'lobby-start';

  G_S_CONNECTED = 'game-connected';
  G_S_LOBBIES_UPDATED = 'lobbies-updated';
  G_S_GAME_STARTED = 'game-started';
  G_S_GAME_COMPLETED = 'game-completed';
  G_S_GAME_UPDATED = 'game-updated';

  normalize(x, A, B, C, D) {
    return C + ((x - A) * (D - C)) / (B - A);
  }
  dist(dx, dy) {
    return Math.sqrt(dx ** 2 + dy ** 2);
  }
  collidesCir(dx, dy, r1, r2) {
    return this.dist(dx, dy) <= r1 + r2;
  }
  createCollision(self, other) {
    return [self.id, other.id];
  }
  getEntity(gameData, entityId) {
    return gameData.entityMap[entityId];
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
          let { x, y, r } = other;
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
    // const projectileList = projectiles.map(id =>
    //   G_getEntityFromEntMap(id, currentGameData)
    // );
    // const shockwaveList = projectileList
    //   .concat(players.map(id => G_getEntityFromEntMap(id, currentGameData)))
    //   .concat(
    //     resources
    //       .filter(
    //         id =>
    //           G_getEntityFromEntMap(id, currentGameData).type !== G_res_shockwave
    //       )
    //       .map(id => G_getEntityFromEntMap(id, currentGameData))
    //   );
    // const bodyList = projectileList.concat(
    //   planets.map(id => G_getEntityFromEntMap(id, currentGameData))
    // );
    // const gravityCollidables = players
    //   .map(id => G_getEntityFromEntMap(id, currentGameData))
    //   .filter(p => !p.dead)
    //   .concat(resources.map(id => G_getEntityFromEntMap(id, currentGameData)));

    const gravityBodies = gameData.planets.map(id =>
      this.getEntity(gameData, id)
    );
    const bodiesAffectedByGravityBodies = gameData.players
      .map(id => this.getEntity(gameData, id))
      .filter(p => p.active);

    let collisions = this.applyGravity(
      bodiesAffectedByGravityBodies,
      gravityBodies,
      [],
      nowDt
    );
    // gameData.collisions = gameData.collisions.concat(collisions);
    // G_applyFields(projectileList, gameData);
    // G_applyShockwaves(shockwaveList, gameData);
    // for (let i = 0; i < gameData.collisions.length; i++) {
    //   const col = gameData.collisions[i];
    //   if (col[2]) {
    //     continue;
    //   }
    //   col[2] = true;
    //   const { remove, cb } = G_handleCollision(col, gameData);
    //   if (remove) {
    //     gameData.collisions.splice(i, 1);
    //     i--;
    //   }
    //   if (cb) {
    //     collisionCallbacks.push(cb);
    //   }
    // }

    // for (let i = 0; i < projectiles.length; i++) {
    //   const p = G_getEntityFromEntMap(projectiles[i], currentGameData);
    //   if (p.meta.type === G_action_move) {
    //     const player = G_getEntityFromEntMap(p.meta.player, currentGameData);
    //     if (player.dead) {
    //       p.meta.remove = true;
    //     } else {
    //       movePlayer(p.meta.player, p.px, p.py, currentGameData);
    //     }
    //   }
    //   if (p.update) {
    //     p.update(p);
    //   }
    //   if (p.meta.remove) {
    //     projectiles.splice(i, 1);
    //     delete gameData.entMap[p.id];
    //     i--;
    //     continue;
    //   }
    //   if (
    //     gameData.tss - p.tStart >= p.t ||
    //     !isInBounds(p.px, p.py, p.r, p.r, currentGameData)
    //   ) {
    //     const collisionWithNothing = G_createCollision(p, null);
    //     // handleCollision returns { remove: true } when the collision should be removed
    //     const { remove, cb } = G_handleCollision(
    //       collisionWithNothing,
    //       currentGameData
    //     );
    //     if (p.meta.type !== G_action_move && !remove) {
    //       collisionWithNothing[2] = true;
    //       currentGameData.collisions.push(collisionWithNothing);
    //     }
    //     if (cb) {
    //       collisionCallbacks.push(cb);
    //     }
    //     projectiles.splice(i, 1);
    //     i--;
    //     continue;
    //   }
    // }

    // for (let i = 0; i < planets.length; i++) {
    //   const planet = G_getEntityFromEntMap(planets[i], currentGameData);
    //   if (planet.meta.remove) {
    //     planets.splice(i, 1);
    //     i--;
    //   }
    // }

    // for (let i = 0; i < fields.length; i++) {
    //   const field = G_getEntityFromEntMap(fields[i], currentGameData);
    //   if (field.meta.remove) {
    //     fields.splice(i, 1);
    //     i--;
    //   }
    // }

    // for (let i = 0; i < collisionCallbacks.length; i++) {
    //   collisionCallbacks[i]();
    // }
  }
})();
