<template>
  <div>
    <v-app
      id="e3"
      v-if="!isFinalProject()"
      dark
      toolbar>
      <v-navigation-drawer
        class="pb-0"
        persistent
        height="100%"
        clipped
        absolute
        enable-resize-watcher
        v-model="drawer"
      >
        <v-list dense>
          <template v-for="(item, i) in items">
            <v-layout
              row
              v-if="item.heading"
              align-center
              :key="i"
            >
              <v-subheader class="mt-3 grey--text text--darken-1" v-if="item.heading">
                {{ item.heading }}
              </v-subheader>
            </v-layout>
            <v-list-tile
              :key="i"
              v-else
              @click="routeTo(item.path)"
            >
              <v-list-tile-action>
                <v-icon>{{ item.icon }}</v-icon>
              </v-list-tile-action>
              <v-list-tile-content>
                <v-list-tile-title>
                  {{ item.text }}
                </v-list-tile-title>
              </v-list-tile-content>
            </v-list-tile>
          </template>
        </v-list>
      </v-navigation-drawer>
      <v-toolbar class="light-blue" dark fixed>
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <v-toolbar-title>James Reilly</v-toolbar-title>
      </v-toolbar>
      <main>
        <v-container>
          <router-view></router-view>
        </v-container>
      </main>
    </v-app> 
    <v-app
      id="e3"
      dark
      v-if="isFinalProject()">
      <router-view></router-view>
    </v-app>
  </div>
</template>

<script>
export default {
  name: 'app',
  data() {
    return {
      drawer: true,
      items: [
        { heading: 'Computational Geometry' },
        { icon: 'class', text: 'Final Project Proposal', path: '/proposal' },
        { icon: 'signal_cellular_null', text: 'Final Project', path: '/' },
      ],
    };
  },
  methods: {
    routeTo(path) {
      this.$router.push(path);
    },
    isFinalProject() {
      return this.$route.path.includes('final');
    },
  },
};
</script>

<style>
  #e3, #e3 .container {
    overflow: hidden;
    z-index: 0;
  }

  #e3 .input-group__details:after {
    background-color: rgba(255,255,255,0.32) !important;
  }

  #e3 .input-group--focused .input-group__append-icon {
    color: inherit !important;
  }

  .play-btn {
    bottom: 16px;
  }
</style>
