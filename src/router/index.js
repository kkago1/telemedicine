import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  // Public
  {
    path: "/",
    component: () => import("@/views/HomeView.vue"),
    meta: { public: true },
  },
  {
    path: "/practitioners",
    component: () => import("@/views/PractitionersView.vue"),
    meta: { public: true },
  },
  {
    path: "/practitioners/:id",
    component: () => import("@/views/PractitionerDetailView.vue"),
    meta: { public: true },
  },

  // Auth (guest only)
  {
    path: "/login",
    component: () => import("@/views/auth/LoginView.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    component: () => import("@/views/auth/RegisterView.vue"),
    meta: { guestOnly: true },
  },

  // Patient
  {
    path: "/patient/dashboard",
    component: () => import("@/views/patient/PatientDashboard.vue"),
    meta: { role: "PATIENT" },
  },
  {
    path: "/patient/requests",
    component: () => import("@/views/patient/PatientRequests.vue"),
    meta: { role: "PATIENT" },
  },
  {
    path: "/patient/relationships",
    component: () => import("@/views/patient/PatientRelationships.vue"),
    meta: { role: "PATIENT" },
  },
  {
    path: "/patient/records",
    component: () => import("@/views/patient/PatientRecords.vue"),
    meta: { role: "PATIENT" },
  },
  {
    path: "/patient/consultation-requests",
    component: () => import("@/views/patient/PatientConsultationRequests.vue"),
    meta: { role: "PATIENT" },
  },
  {
    path: "/patient/consultations",
    component: () => import("@/views/patient/PatientConsultations.vue"),
    meta: { role: "PATIENT" },
  },

  // Practitioner
  {
    path: "/practitioner/dashboard",
    component: () => import("@/views/practitioner/PractitionerDashboard.vue"),
    meta: { role: "PRACTITIONER" },
  },
  {
    path: "/practitioner/requests",
    component: () => import("@/views/practitioner/PractitionerRequests.vue"),
    meta: { role: "PRACTITIONER" },
  },
  {
    path: "/practitioner/patients",
    component: () => import("@/views/practitioner/PractitionerPatients.vue"),
    meta: { role: "PRACTITIONER" },
  },
  {
    path: "/practitioner/patients/:id",
    component: () =>
      import("@/views/practitioner/PractitionerPatientDetail.vue"),
    meta: { role: "PRACTITIONER" },
  },
  {
    path: "/practitioner/consultation-requests",
    component: () =>
      import("@/views/practitioner/PractitionerConsultationRequests.vue"),
    meta: { role: "PRACTITIONER" },
  },
  {
    path: "/practitioner/consultations",
    component: () =>
      import("@/views/practitioner/PractitionerConsultations.vue"),
    meta: { role: "PRACTITIONER" },
  },

  // Admin
  {
    path: "/admin/dashboard",
    component: () => import("@/views/admin/AdminDashboard.vue"),
    meta: { role: "ADMIN" },
  },
  {
    path: "/admin/practitioners",
    component: () => import("@/views/admin/AdminPractitioners.vue"),
    meta: { role: "ADMIN" },
  },
  {
    path: "/admin/users",
    component: () => import("@/views/admin/AdminUsers.vue"),
    meta: { role: "ADMIN" },
  },

  // 404
  {
    path: "/:pathMatch(.*)*",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { public: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

const ROLE_DASHBOARDS = {
  PATIENT: "/patient/dashboard",
  PRACTITIONER: "/practitioner/dashboard",
  ADMIN: "/admin/dashboard",
};

router.beforeEach((to) => {
  const auth = useAuthStore();
  const { public: isPublic, guestOnly, role: requiredRole } = to.meta;

  if (guestOnly && auth.isAuthenticated) {
    return ROLE_DASHBOARDS[auth.role] ?? "/";
  }

  if (isPublic || guestOnly) return true;

  if (!auth.isAuthenticated) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (requiredRole && auth.role !== requiredRole) {
    return ROLE_DASHBOARDS[auth.role] ?? "/";
  }

  return true;
});

export default router;
