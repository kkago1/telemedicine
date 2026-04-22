<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import AuthLayout from '@/components/AuthLayout.vue'
import { register } from '@/api/auth'

const router = useRouter()

const selectedRole = ref('PATIENT')

const phoneRegex = /^(\+254|0)\d{9}$/

const baseFields = {
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Enter a valid Kenyan phone number (e.g. 0712 345 678)'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
}

const patientSchema = z.object({
  ...baseFields,
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
})

const practitionerSchema = z.object({
  ...baseFields,
  licenseNumber: z.string().min(1, 'License number is required'),
  specialization: z.string().min(2, 'Specialization is required'),
})

const validationSchema = computed(() =>
  toTypedSchema(selectedRole.value === 'PATIENT' ? patientSchema : practitionerSchema)
)

const { handleSubmit, defineField, errors, isSubmitting, resetForm } = useForm({ validationSchema })

watch(selectedRole, () => resetForm())

const [fullName, fullNameAttrs] = defineField('fullName')
const [phoneNumber, phoneNumberAttrs] = defineField('phoneNumber')
const [password, passwordAttrs] = defineField('password')
const [dateOfBirth, dateOfBirthAttrs] = defineField('dateOfBirth')
const [gender, genderAttrs] = defineField('gender')
const [licenseNumber, licenseNumberAttrs] = defineField('licenseNumber')
const [specialization, specializationAttrs] = defineField('specialization')

const showPassword = ref(false)
const apiError = ref('')
const successMessage = ref('')

const onSubmit = handleSubmit(async (values) => {
  apiError.value = ''
  successMessage.value = ''
  try {
    await register({ ...values, role: selectedRole.value })
    successMessage.value = 'Account created! Your account will be activated shortly. Redirecting to login…'
    setTimeout(() => router.push('/login'), 2500)
  } catch (err) {
    apiError.value = err.response?.data?.message ?? 'Registration failed. Please try again.'
  }
})
</script>

<template>
  <AuthLayout>
    <h1 class="form-title">Create an account</h1>
    <p class="form-subtitle">Join TeleMed to connect with healthcare professionals.</p>

    <!-- Role selector -->
    <div class="role-selector">
      <button
        type="button"
        class="role-btn"
        :class="{ active: selectedRole === 'PATIENT' }"
        @click="selectedRole = 'PATIENT'"
      >
        <span class="role-icon">🧑‍⚕️</span>
        <span class="role-label">Patient</span>
        <span class="role-desc">Find and consult practitioners</span>
      </button>
      <button
        type="button"
        class="role-btn"
        :class="{ active: selectedRole === 'PRACTITIONER' }"
        @click="selectedRole = 'PRACTITIONER'"
      >
        <span class="role-icon">👨‍⚕️</span>
        <span class="role-label">Practitioner</span>
        <span class="role-desc">Manage patients and consultations</span>
      </button>
    </div>

    <form class="form" @submit.prevent="onSubmit" novalidate>
      <!-- Common fields -->
      <div class="form-group">
        <label class="form-label" for="fullName">Full name</label>
        <input
          id="fullName"
          v-model="fullName"
          v-bind="fullNameAttrs"
          type="text"
          class="form-input"
          :class="{ 'is-error': errors.fullName }"
          placeholder="Jane Doe"
          autocomplete="name"
        />
        <span v-if="errors.fullName" class="form-error">{{ errors.fullName }}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="phoneNumber">Phone number</label>
        <input
          id="phoneNumber"
          v-model="phoneNumber"
          v-bind="phoneNumberAttrs"
          type="tel"
          class="form-input"
          :class="{ 'is-error': errors.phoneNumber }"
          placeholder="0712 345 678"
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
            placeholder="Min. 8 chars, upper, lower, number"
            autocomplete="new-password"
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

      <!-- Patient-specific fields -->
      <template v-if="selectedRole === 'PATIENT'">
        <div class="form-group">
          <label class="form-label" for="dateOfBirth">Date of birth</label>
          <input
            id="dateOfBirth"
            v-model="dateOfBirth"
            v-bind="dateOfBirthAttrs"
            type="date"
            class="form-input"
            :class="{ 'is-error': errors.dateOfBirth }"
          />
          <span v-if="errors.dateOfBirth" class="form-error">{{ errors.dateOfBirth }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="gender">Gender</label>
          <select
            id="gender"
            v-model="gender"
            v-bind="genderAttrs"
            class="form-input"
            :class="{ 'is-error': errors.gender }"
          >
            <option value="" disabled>Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          <span v-if="errors.gender" class="form-error">{{ errors.gender }}</span>
        </div>
      </template>

      <!-- Practitioner-specific fields -->
      <template v-if="selectedRole === 'PRACTITIONER'">
        <div class="form-group">
          <label class="form-label" for="licenseNumber">License number</label>
          <input
            id="licenseNumber"
            v-model="licenseNumber"
            v-bind="licenseNumberAttrs"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.licenseNumber }"
            placeholder="KMPDC-XXXXX"
          />
          <span v-if="errors.licenseNumber" class="form-error">{{ errors.licenseNumber }}</span>
        </div>

        <div class="form-group">
          <label class="form-label" for="specialization">Specialization</label>
          <input
            id="specialization"
            v-model="specialization"
            v-bind="specializationAttrs"
            type="text"
            class="form-input"
            :class="{ 'is-error': errors.specialization }"
            placeholder="e.g. General Practice, Cardiology"
          />
          <span v-if="errors.specialization" class="form-error">{{ errors.specialization }}</span>
        </div>
      </template>

      <div v-if="apiError" class="alert alert-error">{{ apiError }}</div>
      <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

      <button type="submit" class="btn btn-primary submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="form-footer">
      Already have an account?
      <RouterLink to="/login">Sign in</RouterLink>
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
  margin-bottom: 20px;
}

.role-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}

.role-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
}

.role-btn:hover {
  border-color: var(--color-primary-light);
  background: var(--color-bg-subtle);
}

.role-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.role-icon {
  font-size: 22px;
}

.role-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.role-desc {
  font-size: 12px;
  color: var(--color-text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.alert-success {
  background: var(--color-success-light);
  color: #15803D;
  border: 1px solid #BBF7D0;
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
