<template>
 <v-card>
    <v-card-title>
      <div style="width: 100%">
        <h2 class="headline">Polygon Triangulation Pedagogical Aid</h2>
        <h6 class="subheading">Description</h6>
        <p class="body-1">For my final project, I will be created a web application that will illustrate the polygon triangulation algorithm.   
        The plan is to have a slider that will allow the user to move the vertical sweep line through both the monotone subdivision of a polygon 
        and the triangulation steps.  It will also have a visible stack to highlight how the vertexes get deferred and used during the 
        triangulation process.
        </p>
        <h6 class="subheading">References</h6>
        <ul>
          <li>Class notes on polygon triangulation</li><br>
          <li><a href="https://threejs.org/">Three.js Documentation</a></li>
        </ul>
        <br>
        <h6 class="subheading">Timeline</h6>
        <p></p>
        <v-data-table
            v-bind:headers="headers"
            :items="timeline"
            hide-actions
            class="elevation-1"
          >
          <template slot="items" scope="props">
            <td>{{ props.item.week }}</td>
            <td>{{ props.item.due}}</td>
          </template>
        </v-data-table>
      </div>
    </v-card-title>
  </v-card> 
</template>

<script>
export default {
  name: 'Proposal',
  data() {
    return {
      headers: [
        {
          text: 'Week',
          value: 'week',
          sortable: false,
          align: 'left',
        },
        {
          text: 'Deliverable',
          value: 'due',
          sortable: false,
          align: 'left',
        },
      ],
      timeline: [
        {
          week: 5,
          due: 'Three.js project setup.',
        },
        {
          week: 6,
          due: 'Ability to draw polygons on the canvas.',
        },
        {
          week: 7,
          due: 'Add vertical slider to show the sweepline.',
        },
        {
          week: 8,
          due: 'Implement algorithm on backend.',
        },
        {
          week: 9,
          due: 'Add line segments to show monotone polygons.',
        },
        {
          week: 10,
          due: 'Add line segment and vertex highlighting to illustrate the algorithm.',
        },
        {
          week: '11 + 12',
          due: 'Clean up any outstanding bugs.',
        },
      ],
    };
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
</style>
