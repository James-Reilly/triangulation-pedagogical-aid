<template>
 <v-card>
    <v-card-title primary-title>
      <div style="width: 100%">
        <h3 class="display-1">Polygon Triangulation Pedagogical Aid</h3>
        <h6 class="subheading">Final Project for Computational Geometry by James Reilly</h6>
        <v-btn
          color="blue-grey"
          class="white--text"
          @click="gotoApp()"
        >
          Launch App 
          <v-icon right dark>touch_app</v-icon>
        </v-btn>
        <v-btn
          color="blue-grey"
          class="white--text"
        >
          Github 
          <v-icon right dark>code</v-icon>
        </v-btn>
        <div class="body-2">Assumptions: </br>
          Polygons are drawn in CCW order
        </div>
      </div>
    </v-card-title>
    <v-card-text>
      <div class="title mb-3">Horizontally Monotone Polygons</div>
    </v-card-text>
    <v-card-media src="static/monotone.png" height="150px" :contain="true">
    </v-card-media>
    <div class="source-container"><a href="http://www.cs.umd.edu/class/fall2014/cmsc754/Lects/cmsc754-fall14-lects.pdf" class="source">Image Source: David Mount's Lecture Notes for Computational Geometry</a></div>
    <v-card-text>
      <p class="body-2">
        A simple polygon P is horizontally monotone if every vertical line intersects P at most twice.</br>
        </br>
        A polygon can be tested by:
        <ul>
          <li>Finding the minimum and maximum x coordinate of the polygon</li>
          <li>These verticles split the polygon into an upper and lower chain of edges. When walking the chain from left to right verify that the x-coordinate is non-decreasing.</li>
        </ul>
      </p>
    </v-card-text>

    <v-card-text>
      <div class="title mb-3">Subdividing Non-Hortizontally Monotone Polygons</div>
    </v-card-text>
    <v-card-media src="static/monotone-points.png" height="150px" :contain="true">
    </v-card-media>
    <div class="source-container"><a href="http://www.cs.umd.edu/class/fall2014/cmsc754/Lects/cmsc754-fall14-lects.pdf" class="source">Image Source: David Mount's Lecture Notes for Computational Geometry</a></div>
    <v-card-text>
      <p class="body-1">
        Each vertex has one event associated with it.</br>
        Events are processed in x-increasing order.</br>
        <div>
        Fix-up(v, e): if helper(e) is a merge vertex, add a diagonal from v to helper(e)
        </div>
        </br>
        Event Processing:
        <ul>
          <li>
            <div><b>Split</b>: Both edges lie to the right of v and the interior angle is greater than 180.</div>
            <ul>
              <li>Let edge e be the line directly above v in the sweep line status.</li>
              <li>Add the edges of v to the sweep line status. Let e' be the lower of the two edges.</li>
              <li>Set helper(e) to v.</li>
              <li>Set helper(e') to v.</li>
            </ul>
          </li>
          </br>
          <li>
            <div><b>Merge</b>: Both edges lie to the left of v and the interior angle is greater than 180.</div>
            <ul>
              <li>Delete the edges of v from the sweep line status. Let e' be the lower of the two edges.</li>
              <li>Let edge e be the line directly above v in the sweep line status.</li>
              <li>Fix-up(v, e).</li>
              <li>Fix-up(v, e').</li>
              <li>Set helper(e) to v.</li>
            </ul>
          </li>
          </br>
          <li>
            <div><b>Start</b>: Both edges lie to the right of v and the interior angle is less than 180.</div>
            <ul>
              <li>Insert this vertex's edges into the sweep line status. Set the helper of the upper edge to v.</li>
            </ul>
          </li>
          </br>
          <li>
            <div><b>End</b>: Both edges lie to the left of v and the interior angle is less than 180.</div>
            <ul>
              <li>Delete the edges of v from the sweep line status. Let e be the upper of the two edges.</li>
              <li>Fix-up(v, e).</li>
            </ul>
          </li>
          </br>
          <li>
            <div><b>Upper</b>: In a CCW orientation it is the right endpoint of the next edge and the left endpoint of the previous edge</div>
            <ul>
              <li>Let edge e be the edge to the left of v.</li>
              <li>Let edge e' be the edge to the left of v.</li>
              <li>Fix-up(v, e).</li>
              <li>Replace e with e' the sweep line status.</li>
              <li>Set helper(e') to v.</li>
            </ul>
          </li>
          </br>
          <li>
            <div><b>Lower</b>: In a CCW orientation it is the right endpoint of the previous edge and the left endpoint of the next edge</div>
            <ul>
              <li>Let edge e be the line directly above v in the sweep line status.</li>
              <li>Fix-up(v, e).</li>
              <li>Replace the left edge of v with the right edge of v in the sweep line status.</li>
              <li>Set helper(right edge of v) to v.</li>
            </ul>
          </li>
        </ul>
      </p>
    </v-card-text>

    <v-card-text>
      <div class="title mb-3">Triangulation of Horizontally Monotone Polygons</div>
    </v-card-text>
    <v-card-media src="static/triangulation.png" height="200px" :contain="true">
    </v-card-media>
    <div class="source-container"><a href="http://www.cs.umd.edu/class/fall2014/cmsc754/Lects/cmsc754-fall14-lects.pdf" class="source">Image Source: David Mount's Lecture Notes for Computational Geometry</a></div>
    <v-card-text>
      <ul>
        <li>Create a stack to represent the reflex chain</li>
        <li>[v0, v1, ... vn] sorted by increasing x coordinate.</li>
        <li>Push v0 and v1 onto the reflex chain.</li>
        <li>for i = 2 to n:</li>
        <ul>
          <li>if vi is on the same chain as the top of the reflex chain:</li>
          <ul>
            <li>Add diagonals from vi to all visible verticies (vj, ... vk) on the reflex chain.</li>
            <li>Pop vj,...,vk - 1 from the reflex chain.</li>
          </ul>
          <li>else:</li>
          <ul>
            <li>Let vtop be the top of the reflex chain</vi>
            <li>Add a diagonal from vi to each vertex on the reflex chain, popping them off as you do.</vi>
            <li>Push vtop onto the reflex chain.</li> 
          </ul>
          <li>Push vi onto the reflex chain.</li>
        </ul>
      </ul>
    </v-card-text>
    <v-card-text>
      <div class="title mb-3">References</div>
      <p class="body-2">
        <ul>
          <li>Class notes on polygon triangulation</li>
          <li><a href="http://www.cs.umd.edu/class/fall2014/cmsc754/Lects/cmsc754-fall14-lects.pdf">David Mount's Lecture Notes for Computational Geometry</a></li>
          <li><a href="https://wickstopher.github.io/triangulation/algorithm.html">Christopher R. Wick's Polygon Triangulation Pedagical Aid</a></li>
          <li><a href="https://www.cs.ucsb.edu/~suri/cs235/Triangulation.pdf">Subhash Suri's Notes for Polygon Triangulation</a></li>
          <li><a href="https://threejs.org/">Three.js Documentation</a></li>
        </ul>
      </p>
    </v-card-text>
  </v-card> 
</template>

<script>
export default {
  name: 'Proposal',
  data() {
    return {
    };
  },
  methods: {
    gotoApp() {
      this.$router.push({ name: 'triangulation' });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.card {
  width: 100%;
}

.source-container {
  text-align: center;
  font-size: 12px;
}

h1, h2 {
  font-weight: normal;
}

ul {
}

a {
  color: #42b983;
}
</style>
