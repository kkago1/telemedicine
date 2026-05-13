<script setup>
import { ref, watch, onMounted } from "vue";
import dayjs from "dayjs";
import AppLayout from "@/components/AppLayout.vue";
import PaginationBar from "@/components/PaginationBar.vue";
import LoadingSkeleton from "@/components/LoadingSkeleton.vue";
import EmptyState from "@/components/EmptyState.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import { getUsers, activateUser, deactivateUser } from "@/api/admin";

const TABS = ["ALL", "PATIENT", "PRACTITIONER", "ADMIN"];
const TAB_LABELS = {
  ALL: "All",
  PATIENT: "Patients",
  PRACTITIONER: "Practitioners",
  ADMIN: "Admins",
};

const activeTab = ref("ALL");
const users = ref([]);
const pagination = ref(null);
const loading = ref(true);
const error = ref(null);

const confirmAction = ref(null); // { id, type: 'activate' | 'deactivate', name }
const actionInProgress = ref(false);

async function loadPage(page = 1) {
  loading.value = true;
  error.value = null;
  try {
    const params = { page, limit: 10 };
    if (activeTab.value !== "ALL") params.role = activeTab.value;
    const result = await getUsers(params);
    users.value = result.data;
    pagination.value = result.pagination;
  } catch {
    error.value = "Could not load users. Please try again.";
  } finally {
    loading.value = false;
  }
}

watch(activeTab, () => loadPage(1));
onMounted(() => loadPage(1));

async function handleConfirm() {
  actionInProgress.value = true;
  try {
    if (confirmAction.value.type === "activate") {
      await activateUser(confirmAction.value.id);
    } else {
      await deactivateUser(confirmAction.value.id);
    }
    confirmAction.value = null;
    await loadPage(1);
  } catch (err) {
    error.value =
      err.response?.data?.error?.message ??
      "Action failed. Please try again.";
    confirmAction.value = null;
  } finally {
    actionInProgress.value = false;
  }
}

function fmt(date) {
  return dayjs(date).format("MMM D, YYYY");
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0][0].toUpperCase();
}
</script>

<template>
  <AppLayout>
    <div class="page">
      <h1 class="page-title">Manage Users</h1>

      <div class="tabs">
        <button
          v-for="tab in TABS"
          :key="tab"
          class="tab-btn"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ TAB_LABELS[tab] }}
        </button>
      </div>

      <LoadingSkeleton v-if="loading" height="80px" :count="6" />

      <div v-else-if="error" class="error-box">
        <p>{{ error }}</p>
        <button
          class="btn btn-secondary"
          style="margin-top: 12px"
          @click="loadPage(1)"
        >
          Try again
        </button>
      </div>

      <EmptyState
        v-else-if="!users.length"
        :title="`No ${TAB_LABELS[activeTab].toLowerCase()} found`"
      />

      <div v-else class="user-list">
        <div v-for="u in users" :key="u.id" class="user-card card">
          <div class="user-main">
            <div
              class="user-avatar"
              :class="u.isActive ? 'avatar-active' : 'avatar-inactive'"
            >
              {{
                initials(
                  u.patient?.fullName ??
                    u.practitioner?.fullName ??
                    u.phoneNumber,
                )
              }}
            </div>
            <div class="user-info">
              <p class="user-name">
                {{ u?.fullName ?? "—" }}
              </p>
              <p class="user-phone">{{ u.phoneNumber }}</p>
              <p class="user-date">Joined {{ fmt(u.createdAt) }}</p>
            </div>
          </div>
          <div class="user-side">
            <span class="role-badge" :class="`role-${u.role.toLowerCase()}`">{{
              u.role
            }}</span>
            <span
              class="status-dot"
              :class="u.isActive ? 'dot-active' : 'dot-inactive'"
            >
              {{ u.isActive ? "Active" : "Inactive" }}
            </span>
            <button
              v-if="u.role !== 'ADMIN'"
              class="btn action-btn"
              :class="u.isActive ? 'btn-danger' : 'btn-primary'"
              @click="
                confirmAction = {
                  id: u.id,
                  type: u.isActive ? 'deactivate' : 'activate',
                  name:
                    u.patient?.fullName ??
                    u.practitioner?.fullName ??
                    u.phoneNumber,
                }
              "
            >
              {{ u.isActive ? "Deactivate" : "Activate" }}
            </button>
          </div>
        </div>
      </div>

      <PaginationBar
        v-if="pagination"
        :pagination="pagination"
        :loading="loading"
        @page-change="loadPage"
      />
    </div>

    <ConfirmModal
      v-if="confirmAction"
      :title="
        confirmAction.type === 'activate'
          ? 'Activate User?'
          : 'Deactivate User?'
      "
      :message="
        confirmAction.type === 'activate'
          ? `${confirmAction.name} will be able to log in and use the platform again.`
          : `${confirmAction.name} will immediately lose access to the platform.`
      "
      :confirm-label="
        confirmAction.type === 'activate' ? 'Yes, activate' : 'Yes, deactivate'
      "
      :confirm-class="
        confirmAction.type === 'activate' ? 'btn-primary' : 'btn-danger'
      "
      :loading="actionInProgress"
      @confirm="handleConfirm"
      @close="confirmAction = null"
    />
  </AppLayout>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0;
}
.tab-btn {
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.tab-btn:hover {
  color: var(--color-text);
}
.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.error-box {
  color: var(--color-error);
  font-size: 14px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 20px;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-active {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.avatar-inactive {
  background: var(--color-border);
  color: var(--color-text-muted);
}

.user-name {
  font-size: 14px;
  font-weight: 600;
}
.user-phone {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 1px;
}
.user-date {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.user-side {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.role-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.role-patient {
  background: #eff6ff;
  color: #1e40af;
}
.role-practitioner {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}
.role-admin {
  background: #f3e8ff;
  color: #7e22ce;
}

.status-dot {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}
.status-dot::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.dot-active::before {
  background: var(--color-success);
}
.dot-inactive::before {
  background: var(--color-error);
}
.dot-active {
  color: var(--color-success);
}
.dot-inactive {
  color: var(--color-error);
}

.action-btn {
  padding: 6px 14px;
  font-size: 13px;
}
</style>
