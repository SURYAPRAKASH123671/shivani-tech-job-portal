import { useEffect, useState } from 'react'
import client from '../api/client.js'
import Toast from '../components/Toast.jsx'

const emptyForm = {
  fullName: '',
  phone: '',
  dob: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  qualification: '',
  college: '',
  university: '',
  graduationYear: '',
  percentageOrCgpa: '',
  experienceYears: '',
  currentCompany: '',
  currentDesignation: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
  skillIds: [],
  customSkills: [],
  preferredLocationId: '',
  preferredDesignationId: '',
  preferredCategoryId: '',
  resumeUrl: '',
}

export default function CandidateProfile() {
  const [form, setForm] = useState(emptyForm)
  const [email, setEmail] = useState('')
  const [completion, setCompletion] = useState(0)
  const [resumeFileName, setResumeFileName] = useState(null)
  const [lookups, setLookups] = useState({ locations: [], designations: [], categories: [], skills: [] })
  const [customSkillDraft, setCustomSkillDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [toast, setToast] = useState(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [profileRes, locations, designations, categories, skills] = await Promise.all([
        client.get('/api/candidate/profile'),
        client.get('/api/admin/locations'),
        client.get('/api/admin/designations'),
        client.get('/api/admin/categories'),
        client.get('/api/admin/skills'),
      ])
      applyProfile(profileRes.data)
      setLookups({
        locations: locations.data,
        designations: designations.data,
        categories: categories.data,
        skills: skills.data,
      })
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not load your profile.' })
    } finally {
      setLoading(false)
    }
  }

  function applyProfile(profile) {
    setEmail(profile.email)
    setCompletion(profile.profileCompletionPercentage)
    setResumeFileName(profile.resumeFileName)
    setForm({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      country: profile.country || '',
      pincode: profile.pincode || '',
      qualification: profile.qualification || '',
      college: profile.college || '',
      university: profile.university || '',
      graduationYear: profile.graduationYear ?? '',
      percentageOrCgpa: profile.percentageOrCgpa || '',
      experienceYears: profile.experienceYears ?? '',
      currentCompany: profile.currentCompany || '',
      currentDesignation: profile.currentDesignation || '',
      currentSalary: profile.currentSalary ?? '',
      expectedSalary: profile.expectedSalary ?? '',
      noticePeriod: profile.noticePeriod || '',
      skillIds: (profile.skills || []).map((s) => s.id),
      customSkills: profile.customSkills || [],
      preferredLocationId: profile.preferredLocation?.id || '',
      preferredDesignationId: profile.preferredDesignation?.id || '',
      preferredCategoryId: profile.preferredCategory?.id || '',
      resumeUrl: profile.resumeUrl || '',
    })
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function toggleSkill(skillId) {
    setForm((prev) => {
      const has = prev.skillIds.includes(skillId)
      return { ...prev, skillIds: has ? prev.skillIds.filter((id) => id !== skillId) : [...prev.skillIds, skillId] }
    })
  }

  function addCustomSkill() {
    const value = customSkillDraft.trim()
    if (!value || form.customSkills.includes(value)) return
    setForm({ ...form, customSkills: [...form.customSkills, value] })
    setCustomSkillDraft('')
  }

  function removeCustomSkill(skill) {
    setForm({ ...form, customSkills: form.customSkills.filter((s) => s !== skill) })
  }

  function validate() {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required'
    if (form.phone && !/^[0-9+\-() ]{7,15}$/.test(form.phone)) errors.phone = 'Enter a valid phone number'
    if (form.graduationYear && (form.graduationYear < 1950 || form.graduationYear > 2100)) {
      errors.graduationYear = 'Graduation year looks wrong'
    }
    if (form.experienceYears && Number(form.experienceYears) < 0) errors.experienceYears = 'Must be a positive number'
    if (form.currentSalary && Number(form.currentSalary) < 0) errors.currentSalary = 'Must be a positive number'
    if (form.expectedSalary && Number(form.expectedSalary) < 0) errors.expectedSalary = 'Must be a positive number'
    return errors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setToast({ type: 'error', message: 'Please correct the highlighted fields.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        graduationYear: form.graduationYear === '' ? null : Number(form.graduationYear),
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        currentSalary: form.currentSalary === '' ? null : Number(form.currentSalary),
        expectedSalary: form.expectedSalary === '' ? null : Number(form.expectedSalary),
        preferredLocationId: form.preferredLocationId || null,
        preferredDesignationId: form.preferredDesignationId || null,
        preferredCategoryId: form.preferredCategoryId || null,
        dob: form.dob || null,
      }
      const { data } = await client.put('/api/candidate/profile', payload)
      applyProfile(data)
      setFieldErrors({})
      setToast({ type: 'success', message: 'Profile saved.' })
    } catch (err) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors)
      }
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not save your profile.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setToast({ type: 'error', message: 'Only PDF resumes are accepted.' })
      e.target.value = ''
      return
    }
    setUploadingResume(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await client.post('/api/candidate/profile/resume', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      applyProfile(data)
      setToast({ type: 'success', message: 'Resume uploaded.' })
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not upload that file.' })
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  async function downloadResume() {
    try {
      const { data } = await client.get('/api/candidate/profile/resume/download', { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = resumeFileName || 'resume.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not download your resume.' })
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-4xl px-6 py-10 text-muted">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-dark">Candidate</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-navy">Your profile</h1>
      <p className="mt-2 text-muted">Keep this up to date — it's what employers see when you apply.</p>

      <div className="mt-6 rounded-xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Profile completion</span>
          <span className="font-medium text-ink">{completion}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-amber transition-all" style={{ width: `${completion}%` }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <Section title="Personal information">
          <Field label="Full name" error={fieldErrors.fullName}>
            <input className={inputClass(fieldErrors.fullName)} value={form.fullName} onChange={update('fullName')} required />
          </Field>
          <Field label="Mobile number" error={fieldErrors.phone}>
            <input className={inputClass(fieldErrors.phone)} value={form.phone} onChange={update('phone')} />
          </Field>
          <Field label="Email">
            <input className={inputClass()} value={email} readOnly disabled />
          </Field>
          <Field label="Date of birth">
            <input type="date" className={inputClass()} value={form.dob} onChange={update('dob')} />
          </Field>
          <Field label="Gender">
            <select className={selectClass()} value={form.gender} onChange={update('gender')}>
              <option value="">Select…</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Address" full>
            <textarea rows={2} className={inputClass()} value={form.address} onChange={update('address')} />
          </Field>
          <Field label="City">
            <input className={inputClass()} value={form.city} onChange={update('city')} />
          </Field>
          <Field label="State">
            <input className={inputClass()} value={form.state} onChange={update('state')} />
          </Field>
          <Field label="Country">
            <input className={inputClass()} value={form.country} onChange={update('country')} />
          </Field>
          <Field label="Pincode">
            <input className={inputClass()} value={form.pincode} onChange={update('pincode')} />
          </Field>
        </Section>

        <Section title="Education">
          <Field label="Degree">
            <input className={inputClass()} value={form.qualification} onChange={update('qualification')} placeholder="e.g. B.Tech" />
          </Field>
          <Field label="College">
            <input className={inputClass()} value={form.college} onChange={update('college')} />
          </Field>
          <Field label="University">
            <input className={inputClass()} value={form.university} onChange={update('university')} />
          </Field>
          <Field label="Graduation year" error={fieldErrors.graduationYear}>
            <input
              type="number"
              className={inputClass(fieldErrors.graduationYear)}
              value={form.graduationYear}
              onChange={update('graduationYear')}
            />
          </Field>
          <Field label="Percentage / CGPA">
            <input className={inputClass()} value={form.percentageOrCgpa} onChange={update('percentageOrCgpa')} placeholder="e.g. 8.2 CGPA" />
          </Field>
        </Section>

        <Section title="Professional">
          <Field label="Experience (years)" error={fieldErrors.experienceYears}>
            <input
              type="number"
              className={inputClass(fieldErrors.experienceYears)}
              value={form.experienceYears}
              onChange={update('experienceYears')}
            />
          </Field>
          <Field label="Current company">
            <input className={inputClass()} value={form.currentCompany} onChange={update('currentCompany')} />
          </Field>
          <Field label="Current designation">
            <input className={inputClass()} value={form.currentDesignation} onChange={update('currentDesignation')} />
          </Field>
          <Field label="Current salary (₹/yr)" error={fieldErrors.currentSalary}>
            <input
              type="number"
              className={inputClass(fieldErrors.currentSalary)}
              value={form.currentSalary}
              onChange={update('currentSalary')}
            />
          </Field>
          <Field label="Expected salary (₹/yr)" error={fieldErrors.expectedSalary}>
            <input
              type="number"
              className={inputClass(fieldErrors.expectedSalary)}
              value={form.expectedSalary}
              onChange={update('expectedSalary')}
            />
          </Field>
          <Field label="Notice period">
            <input className={inputClass()} value={form.noticePeriod} onChange={update('noticePeriod')} placeholder="e.g. 30 days" />
          </Field>
        </Section>

        <Section title="Skills">
          <div className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {lookups.skills.map((skill) => {
                const active = form.skillIds.includes(skill.id)
                return (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      active ? 'border-navy bg-navy text-white' : 'border-line text-ink hover:border-navy'
                    }`}
                  >
                    {skill.name}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                className={inputClass()}
                placeholder="Add a custom skill not in the list above"
                value={customSkillDraft}
                onChange={(e) => setCustomSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-navy"
              >
                Add
              </button>
            </div>

            {form.customSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.customSkills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 rounded-full bg-canvas px-3 py-1 text-xs text-ink">
                    {skill}
                    <button type="button" onClick={() => removeCustomSkill(skill)} className="text-muted hover:text-danger">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        <Section title="Career preferences">
          <Field label="Preferred location">
            <select className={selectClass()} value={form.preferredLocationId} onChange={update('preferredLocationId')}>
              <option value="">Any</option>
              {lookups.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred job role">
            <select className={selectClass()} value={form.preferredDesignationId} onChange={update('preferredDesignationId')}>
              <option value="">Any</option>
              {lookups.designations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred category">
            <select className={selectClass()} value={form.preferredCategoryId} onChange={update('preferredCategoryId')}>
              <option value="">Any</option>
              {lookups.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Resume">
          <div className="sm:col-span-2 space-y-3">
            <div>
              <label className="block text-sm font-medium text-ink">Upload PDF</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              />
              {resumeFileName && (
                <p className="mt-1 text-xs text-muted">
                  Currently on file: {resumeFileName}{' '}
                  <button type="button" onClick={downloadResume} className="font-medium text-navy hover:underline">
                    Download
                  </button>
                </p>
              )}
              {uploadingResume && <p className="mt-1 text-xs text-muted">Uploading…</p>}
            </div>
            <div className="text-center text-xs text-muted">— or —</div>
            <Field label="Resume URL (e.g. Google Drive link)">
              <input
                className={inputClass()}
                value={form.resumeUrl}
                onChange={update('resumeUrl')}
                placeholder="https://…"
              />
            </Field>
            {form.resumeUrl && !resumeFileName && (
              <p className="text-xs text-muted">
                Linked:{' '}
                <a href={form.resumeUrl} target="_blank" rel="noreferrer" className="text-navy hover:underline">
                  {form.resumeUrl}
                </a>
              </p>
            )}
          </div>
        </Section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-navy px-6 py-2.5 text-sm font-medium text-white hover:bg-navy-light disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-navy">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({ label, error, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-ink">{label}</label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

function inputClass(error) {
  return `w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
    error ? 'border-danger focus:border-danger' : 'border-line focus:border-navy'
  }`
}

function selectClass() {
  return 'w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none'
}
