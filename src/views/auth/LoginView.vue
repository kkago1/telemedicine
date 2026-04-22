<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AuthLayout from '@/components/AuthLayout.vue'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const schema = toTypedSchema(
  z.object({
    phoneNumber: z.string().min(1, 'Phone number is required'),
    password: z.string().min(1, 'Password is required'),
  })
)

const { handleSubmit, defineField, errors, isSubmitting } = useForm({ validationSchema: schema })

const [phoneNumber, phoneNumberAttrs] = defineField('phoneNumber')
const [password, passwordAttrs] = defineField('password')

const showPassword = ref(false)
const apiError = ref('')

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  try {
    const { token, user } = await login(values)
    auth.setAuth(token, user)
    const redirect = router.currentRoute.value.query.redirect
    router.push(redirect || auth.dashboardPath)
  } catch (err) {
    apiError.value = err.response?.data?.error?.message ?? 'Login failed. Please try again.'
  }
})
</script>

<template>
  <AuthLayout>
    <h1 class="form-title">Sign in</h1>
    <p class="form-subtitle">Welcome back to TeleMed.</p>

    <form class="form" @submit.prevent="onSubmit" novalidate>
      <div class="form-group">
        <label class="form-label" for="phoneNumber">Phone number</label>
        <input
          id="phoneNumber"
          v-model="phoneNumber"
          v-bind="phoneNumberAttrs"
          type="tel"
          class="form-input"
          :class="{ 'is-error': errors.phoneNumber }"
          placeholder="07XX XXX XXX"
          autocomplete="tel"
        />
        <span v-if="errors.phoneNumber" class="form-error">{{ errors.phoneNumber }}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <div class="input-wrap">
          <input
            id="password"
            v-model="password"
            v-bind="passwordAttrs"
            :type="showPassword ? 'text' : 'password'"
            class="form-input"
            :class="{ 'is-error': errors.password }"
            placeholder="Your password"
            autocomplete="current-password"
          />
          <button
            type="button"
            class="toggle-password"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
      </div>

      <div v-if="apiError" class="alert alert-error">{{ apiError }}</div>

      <button type="submit" class="btn btn-primary submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="form-footer">
      Don't have an account?
      <RouterLink to="/register">Create one</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.form-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
}

.form-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 4px;
  margin-bottom: 24px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrap .form-input {
  padding-right: 60px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.toggle-password:hover {
  color: var(--color-primary-dark);
}

.alert {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
}

.alert-error {
  background: var(--color-error-light);
  color: var(--color-error);
  border: 1px solid #FECACA;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 4px;
}

.form-footer {
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
  margin-top: 20px;
}
</style>
