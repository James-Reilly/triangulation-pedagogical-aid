<template>
  <div class="project-container">
    <div ref="canvas" class="canvas-container">
    </div>
    <div class="geometry-toolbar">
      <v-slider v-model="sliderPos" :disabled="sliderDisabled" :hide-details="true"></v-slider>
      <div>
        <v-btn flat v-on:click="handleStart()" :disabled="startDisabled">{{ startText }}</v-btn>
        <v-btn flat v-on:click="reset()">Reset</v-btn>
      </div>
      <v-chip class="chip-orange" text-color="white">Split Vertex</v-chip>
      <v-chip class="chip-yellow" text-color="white">Merge Vertex</v-chip>
      <v-chip class="chip-green" text-color="white">Start Vertex</v-chip>
      <v-chip class="chip-red" text-color="white">End Vertex</v-chip>
      <v-chip class="chip-pink" text-color="white">Upper Vertex</v-chip>
      <v-chip class="chip-white" text-color="white">Lower Vertex</v-chip>
      <v-chip class="chip-teal" text-color="white">Triangulation Diagonal</v-chip>
      <v-chip class="chip-hot-pink" text-color="white">Monotone Diagonal</v-chip>
    </div>
  </div>
</template>

<script>
import { Scene, OrthographicCamera, WebGLRenderer, Geometry, Vector3, PointsMaterial, Points, LineBasicMaterial, LineSegments, Vector2, Raycaster, Matrix3, Line3 } from 'three';

const SortedArray = require('collections/sorted-array');

const EventType = {
  SPLIT: 0,
  MERGE: 1,
  START: 2,
  END: 3,
  UPPER: 4,
  LOWER: 5,
};

const ChainType = {
  UPPER: 0,
  LOWER: 1,
};

class Edge {
  constructor(a, b) {
    this.start = a;
    this.end = b;
    this.line = new Line3(a.vector, b.vector);
    a.setAfter(this);
    b.setBefore(this);
    this.calc_line(this.start.vector, this.end.vector);
    this.helper = null;
  }

  setHelper(v) {
    this.helper = v;
  }

  calc_line(p1, p2) {
    this.slope = (p2.y - p1.y) / (p2.x - p1.x);
    this.b = (p1.y - (this.slope * p1.x));
  }

  getY(x) {
    return (this.slope * x) + this.b;
  }
}

class Vertex {
  constructor(p, ui) {
    this.vector = p;
    this.ui = ui;
  }

  setColor(hex) {
    this.ui.material.color.setHex(hex);
  }

  setType(t) {
    this.type = t;
  }

  setBefore(o) {
    this.before = o;
  }

  setAfter(o) {
    this.after = o;
  }

  setChain(c) {
    this.chain = c;
  }

  getUpperEdge() {
    const before_start = this.before.start;
    const before_end = this.before.end;
    const after_start = this.after.start;
    const after_end = this.after.end;

    let before_compare = false;
    if (this === before_start) {
      if (this === after_start) {
        before_compare = before_end.vector.y > after_end.vector.y;
      } else {
        before_compare = before_end.vector.y > after_start.vector.y;
      }
    } else if (this === after_start) {
      before_compare = before_start.vector.y > after_end.vector.y;
    } else {
      before_compare = before_start.vector.y > after_start.vector.y;
    }

    if (before_compare) {
      return this.before;
    }
    return this.after;
  }

  getLowerEdge() {
    const upper = this.getUpperEdge();
    if (this.before === upper) {
      return this.after;
    }
    return this.before;
  }

  getNextVertex() {
    const after_start = this.after.start;
    const after_end = this.after.end;
    if (after_start === this) {
      return after_end;
    }
    return after_start;
  }

  static clone(v) {
    const vec = v.vector.clone();
    const type = v.type;
    const ui = v.ui;
    const new_v = new Vertex(vec, ui);
    new_v.setType(type);
    return new_v;
  }
}

class Polygon {
  constructor(vertices) {
    this.vertices = vertices;
  }

  static split(a, b) {
    const out = [];
    let a_points = [];
    let b_points = [];

    let cur = a;
    while (cur !== b) {
      a_points.push(cur);
      cur = cur.getNextVertex();
    }
    a_points.push(cur);

    while (cur !== a) {
      b_points.add(cur);
      cur = cur.getNextVertex();
    }
    b_points.add(cur);

    a_points = a_points.map(x => Vertex.clone(x));
    b_points = b_points.map(x => Vertex.clone(x));
    for (let i = 0; i < a_points.length; i += 1) {
      let next = i + 1;
      if (next === a_points.length) {
        next = 0;
      }
      // This is bad, I'm sorry
      console.log(new Edge(a_points[i], a_points[next]));
    }
    for (let i = 0; i < b_points.length; i += 1) {
      let next = i + 1;
      if (next === b_points.length) {
        next = 0;
      }
      // This is bad, I'm sorry
      console.log(new Edge(b_points[i], b_points[next]));
    }
    out.push(new Polygon(a_points));
    out.push(new Polygon(b_points));
    return out;
  }
}

const scene = new Scene();
const width = window.innerWidth;
const height = window.innerHeight - 150;
const camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);

const renderer = new WebGLRenderer();
renderer.setSize(width, height);

let points = [];
let lines = [];

const mstate = {
  inactive_diagonals: [],
  active_diagonals: [],
};

const tstate = {
  inactive_diagonals: [],
  active_diagonals: [],
};

let sweep_position = 16;
const sweep_geo = new Geometry();
sweep_geo.vertices.push(new Vector3(0, 0, 2));
sweep_geo.vertices.push(new Vector3(0, height, 2));
const sweep_mat = new LineBasicMaterial({ color: 0xff0000 });
const sweep_line = new LineSegments(sweep_geo, sweep_mat);
scene.add(sweep_line);

camera.zoom = 1;
camera.position.z = 50;
camera.position.y = height / 2;
camera.position.x = (width / 2);
let edges = [];

const getPoint = (index) => {
  let real_index = index;
  if (index === -1) {
    real_index = points.length - 1;
  } else if (index === points.length) {
    real_index = 0;
  }
  return points[real_index].geometry.vertices[0];
};

const addSegment = (a, b) => {
  if (points.length > 1) {
    const line_geo = new Geometry();
    line_geo.vertices.push(new Vector3(a.x, a.y, 2));
    line_geo.vertices.push(new Vector3(b.x, b.y, 2));
    const line_mat = new LineBasicMaterial({ color: 0x33A5FF });
    const line = new LineSegments(line_geo, line_mat);
    scene.add(line);
    lines.push(line);
  }
};

const addDiagonal = (a, b, x, montone) => {
  const line_geo = new Geometry();
  let z_index = 0;
  if (montone) {
    z_index = 1;
  }
  line_geo.vertices.push(new Vector3(a.vector.x, a.vector.y, z_index));
  line_geo.vertices.push(new Vector3(b.vector.x, b.vector.y, z_index));
  if (montone) {
    const line_mat = new LineBasicMaterial({ color: 0xff33a4 });
    const line = new LineSegments(line_geo, line_mat);
    mstate.inactive_diagonals.push([x, line]);
  } else {
    const line_mat = new LineBasicMaterial({ color: 0x33FF93 });
    const line = new LineSegments(line_geo, line_mat);
    tstate.inactive_diagonals.push([x, line]);
  }

  return [a, b];
};

const addPoint = (x, y) => {
  const point_geo = new Geometry();
  point_geo.vertices.push(new Vector3(x, y, 3));
  const point_mat = new PointsMaterial({ size: 1 });
  const point = new Points(point_geo, point_mat);
  points.push(point);
  scene.add(point);
  const a = getPoint(points.length - 2);
  const b = getPoint(points.length - 1);
  addSegment(a, b);
};

const updateMonotone = (x) => {
  if (mstate.active) {
    while (mstate.inactive_diagonals.length > 0) {
      const top = mstate.inactive_diagonals[mstate.inactive_diagonals.length - 1];
      if (x > top[0]) {
        scene.add(top[1]);
        mstate.active_diagonals.push(mstate.inactive_diagonals.pop());
      } else {
        break;
      }
    }
    while (mstate.active_diagonals.length > 0) {
      const top = mstate.active_diagonals[mstate.active_diagonals.length - 1];
      if (x < top[0]) {
        scene.remove(top[1]);
        mstate.inactive_diagonals.push(mstate.active_diagonals.pop());
      } else {
        break;
      }
    }
  } else {
    while (mstate.inactive_diagonals.length > 0) {
      scene.add(mstate.inactive_diagonals.pop()[1]);
    }
  }
};

const updateTriangulation = (x) => {
  if (tstate.active) {
    while (tstate.inactive_diagonals.length > 0) {
      const top = tstate.inactive_diagonals[tstate.inactive_diagonals.length - 1];
      if (x > top[0]) {
        scene.add(top[1]);
        tstate.active_diagonals.push(tstate.inactive_diagonals.pop());
      } else {
        break;
      }
    }

    while (tstate.active_diagonals.length > 0) {
      const top = tstate.active_diagonals[tstate.active_diagonals.length - 1];
      if (x < top[0]) {
        scene.remove(top[1]);
        tstate.inactive_diagonals.push(tstate.active_diagonals.pop());
      } else {
        break;
      }
    }
  }
};

const render = () => {
  requestAnimationFrame(render);
  sweep_line.position.set(sweep_position, sweep_line.position.y, sweep_line.position.z);
  updateMonotone(sweep_position);
  updateTriangulation(sweep_position);
  renderer.render(scene, camera);
};

render();

const getPointsFromClicks = (event) => {
  if (event.clientY < height && event.clientX > 16 && event.clientX < width - 32) {
    const raycaster = new Raycaster();
    const mouse = new Vector2();
    mouse.x = (event.clientX / width) * 2 - 1;
    mouse.y = -(event.clientY / height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    addPoint(raycaster.ray.origin.x, raycaster.ray.origin.y);
  }
};

document.addEventListener('click', getPointsFromClicks);

const line_equal = (a, b) => a.line.equals(b.line);

const sweep_status = new SortedArray([], line_equal);

const orient = (p, q, r) => {
  const m = new Matrix3();
  m.set(1, p.x, p.y, 1, q.x, q.y, 1, r.x, r.y);
  return m.determinant();
};

 /*
 * Calculates the angle ABC (in radians)
 *
 * A first point, ex: {x: 0, y: 0}
 * C second point
 * B center point
 * Adapted from a Walter Stabosz
 * https://stackoverflow.com/questions/17763392/how-to-calculate-in-javascript-angle-between-3-points
 */
const find_angle = (A, B, C, left_hand) => {
  const AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
  const BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
  const AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
  let angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
  const dir = orient(A, B, C);
  if ((left_hand && dir < 0) || (!left_hand && dir > 0)) {
    angle = (2 * Math.PI) - angle;
  }
  return angle;
};

const generate_events = () => {
  const events = [];
  let left_hand = true;
  const vertices = points.map(x => new Vertex(x.geometry.vertices[0], x));
  for (let i = 0; i < points.length; i += 1) {
    let j = i + 1;
    if (i === points.length - 1) {
      j = 0;
    }
    const vertex = vertices[i];
    edges.push(new Edge(vertex, vertices[j]));
    const p_before = getPoint(i - 1);
    const p = getPoint(i);
    const p_after = getPoint(i + 1);
    let type;
    if (p_before.x > p.x && p_after.x > p.x) {
      // Split or Start
      if (find_angle(p_before, p, p_after, left_hand) > Math.PI) {
        type = EventType.SPLIT;
        vertex.setColor(0xffa500);
      } else {
        type = EventType.START;
        vertex.setColor(0x00ff00);
      }
    } else if (p_before.x < p.x && p_after.x < p.x) {
      // Merge or End
      if (find_angle(p_before, p, p_after, left_hand) > Math.PI) {
        type = EventType.MERGE;
        vertex.setColor(0xffff00);
      } else {
        type = EventType.END;
        vertex.setColor(0xff0000);
      }
    } else if (p_before.x > p.x && p_after.x < p.x) {
      type = EventType.UPPER;
      vertex.setColor(0xff69b4);
    } else {
      type = EventType.LOWER;
    }
    vertex.setType(type);
    events.push({
      type,
      vertex,
    });
  }
  return [events, vertices];
};

const generate_triangle_events = (vertices) => {
  let type = ChainType.LOWER;
  let min_x = vertices[0].vector.x;
  let min_i = 0;
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i];
    if (v.vector.x < min_x) {
      min_x = v.vector.x;
      min_i = i;
    }
  }

  const start = vertices[min_i];
  let cur = vertices[min_i];
  while (cur.getNextVertex() !== start) {
    cur.setChain(type);
    const next = cur.getNextVertex();
    if (type === ChainType.LOWER && next.vector.x < cur.vector.x) {
      type = ChainType.UPPER;
    }
    cur = next;
  }
  cur.setChain(type);
  return vertices;
};

const is_reflex = (v) => {
  const before = v.before;
  const after = v.after;
  let a = before.start;
  let c = after.end;
  if (a === v) {
    a = before.end;
  }
  if (c === v) {
    c = after.start;
  }
  const angle = find_angle(a.vector, v.vector, c.vector, true);
  return angle > Math.PI;
};

const getMonotonePolygons = (polygon, diagonals) => {
  let polygons = [polygon];

  for (let i = 0; i < diagonals.length; i += 1) {
    const diagonal = diagonals[i];

    let cur_poly = null;
    for (let j = 0; j < polygons.length; j += 1) {
      if (polygons[j].vertices.includes(diagonal[0]) &&
      polygons[j].vertices.includes(diagonal[1])) {
        cur_poly = polygons[j];
        break;
      }
    }
    if (cur_poly !== null) {
      polygons = polygons.filter(x => x !== cur_poly);
      polygons = polygons.concat(Polygon.split(diagonal[0], diagonal[1]));
    }
  }

  return polygons;
};

export default {

  name: 'triangulation',
  data() {
    return {
      startText: 'Start Monotone',
      sliderPos: 0,
      sliderDisabled: true,
      startDisabled: false,
      polygons: [],
    };
  },
  watch: {
    sliderPos(val) {
      const percent = val / 100;
      sweep_position = ((width - 48) * percent) + 16;
    },
  },
  methods: {
    fixUp(v, e) {
      let val = e.helper;
      if (val !== null && val !== undefined && val.type === EventType.MERGE) {
        return addDiagonal(v, val, v.vector.x, true);
      }
      return null;
    },
    getAbove(v, x) {
      const line_array = sweep_status.toArray();
      for (let i = 0; i < line_array.length; i += 1) {
        const line = line_array[i];
        if (line.getY(x) >= v.vector.y && line.start !== v && line.end !== v) {
          return line;
        }
      }
      return null;
    },
    horizontalMonotone(events) {
      let diagonals = [];
      for (let i = 0; i < events.length; i += 1) {
        const event = events[i];
        const v = event.vertex;
        const x = v.vector.x;
        if (event.type === EventType.SPLIT) {
          const above = this.getAbove(v, x);
          diagonals.push(addDiagonal(v, above.helper, x, true));
          v.getLowerEdge().setHelper(v);
          above.setHelper(v);
        } else if (event.type === EventType.MERGE) {
          sweep_status.delete(v.after);
          sweep_status.delete(v.before);
          const above = this.getAbove(v, x);
          diagonals.push(this.fixUp(v, above));
          diagonals.push(this.fixUp(v, v.getLowerEdge()));
          above.setHelper(v);
        } else if (event.type === EventType.START) {
          sweep_status.add(v.after);
          sweep_status.add(v.before);
          v.getUpperEdge().setHelper(v);
        } else if (event.type === EventType.END) {
          diagonals.push(this.fixUp(v, v.getUpperEdge()));
          sweep_status.delete(v.after);
          sweep_status.delete(v.before);
        } else if (event.type === EventType.UPPER) {
          diagonals.push(this.fixUp(v, v.after));
          sweep_status.delete(v.after);
          sweep_status.add(v.before);
          v.before.setHelper(v);
        } else if (event.type === EventType.LOWER) {
          diagonals.push(this.fixUp(v, v.before));
          sweep_status.delete(v.before);
          sweep_status.add(v.after);
          v.after.setHelper(v);
        }
      }
      diagonals = diagonals.filter(x => x !== null);
      mstate.active = true;
      return diagonals;
    },
    triangulate(events) {
      const chain = [];
      chain.push(events[0]);
      chain.push(events[1]);
      for (let i = 2; i < events.length; i += 1) {
        const v = events[i];
        const top = chain[chain.length - 1];
        if (v.chain !== top.chain) {
          while (chain.length > 0) {
            addDiagonal(v, chain.pop(), v.vector.x, false);
          }
          chain.push(top);
        } else if (!is_reflex(top)) {
          let chain_prev = chain.pop();
          if (chain.length !== 0) {
            let chain_prev_prev = chain[chain.length - 1];
            const isUpper = chain_prev.chain === ChainType.UPPER;
            while ((isUpper &&
            find_angle(chain_prev_prev.vector, chain_prev.vector, v.vector, true) > Math.PI) ||
            (!isUpper &&
            find_angle(chain_prev_prev.vector, chain_prev.vector, v.vector, true) < Math.PI)) {
              addDiagonal(v, chain_prev, v.vector.x, false);
              if (chain_prev.chain !== chain_prev_prev.chain) {
                break;
              }
              chain_prev = chain.pop();
              if (chain.length === 0) {
                break;
              }
              chain_prev_prev = chain[chain.length - 1];
            }
          }
          chain.push(chain_prev);
        }
        chain.push(v);
      }
    },
    start() {
      if (points.length > 1) {
        mstate.active = true;
        tstate.active = false;
        this.sliderDisabled = false;
        addSegment(getPoint(0), getPoint(points.length - 1));
        document.removeEventListener('click', getPointsFromClicks);
        const data = generate_events();
        const events = data[0];
        const vertices = data[1];
        events.sort((a, b) => a.vertex.vector.x - b.vertex.vector.x);
        const diagonals = this.horizontalMonotone(events);
        const base_poly = new Polygon(vertices);
        this.polygons = getMonotonePolygons(base_poly, diagonals);
      }
    },
    next() {
      mstate.active = false;
      this.sliderPos = 0;

      for (let i = 0; i < this.polygons.length; i += 1) {
        const vertices = this.polygons[i].vertices;
        let events = generate_triangle_events(vertices);
        events = events.sort((a, b) => a.vector.x - b.vector.x);
        this.triangulate(events);
      }
      tstate.inactive_diagonals.sort((a, b) => b[0] - a[0]);
      tstate.active = true;
    },
    handleStart() {
      if (mstate.active) {
        this.startDisabled = true;
        this.next();
      } else {
        this.start();
        this.startText = 'Start Triangulation';
      }
    },
    reset() {
      mstate.active = false;
      tstate.active = false;
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      scene.add(sweep_line);

      lines = [];
      points = [];
      edges = [];
      mstate.active_diagonals = [];
      mstate.inactive_diagonals = [];
      tstate.active_diagonals = [];
      tstate.inactive_diagonals = [];
      this.sliderPos = 0;
      this.sliderDisabled = true;
      this.startDisabled = false;
      this.polygons = [];

      this.startText = 'Start Monotone';
      document.addEventListener('click', getPointsFromClicks);
    },
  },
  mounted() {
    const canvas = this.$refs.canvas;
    canvas.appendChild(renderer.domElement);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.chip-red {
  background: red!important;
  color: white!important;
}
.chip-green {
  background: #00ff00!important;
  color: black!important;
}
.chip-yellow {
  background: yellow!important;
  color: black!important;
}
.chip-pink {
  background: #ff69b4!important;
  color: black!important;
}
.chip-orange {
  background: orange!important;
  color: black!important;
}

.chip-white {
  background: white!important;
  color: black!important;
}

.chip-teal {
  background: #33FF93!important;
  color: black!important;
}

.chip-hot-pink {
  background: #ff33a4!important;
  color: white!important;
}
.project-container {
  width: 100%;
}

.geometry-toolbar {
  min-height: 150px;
  max-height: 150px;
  width: 100%;
  padding: 10px 16px;
}

.input-group {
  padding-top: 0;
}
.input-group__details {
  display: none!important;
}

.canvas-container {
  position: relative;
}
h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

#canvas {
  width: calc(100% - 32px);
}

.card {
  padding: 20px;
}
</style>

