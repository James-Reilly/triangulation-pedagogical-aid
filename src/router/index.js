import Vue from 'vue';
import Router from 'vue-router';
import Proposal from '@/components/comp-geometry/Proposal';

// Lazy Load Components so there is only one renderer at a time
const Triangulation = () => import('@/components/comp-geometry/Triangulation');
const Pedagogical = () => import('@/components/comp-geometry/Pedagogical');

Vue.use(Router);

const router = new Router({
  routes: [
    {
      path: '/proposal',
      name: 'Computer Geometry Final Project Proposal',
      component: Proposal,
    },
    {
      path: '/',
      name: 'Computer Geometry Final Project',
      component: Pedagogical,
    },
    {
      path: '/geometry/final',
      name: 'triangulation',
      component: Triangulation,
    },
  ],
});

export default router;
