'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import { AutocompleteTextarea } from '@/components/ui/autocomplete-textarea'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

/**
 * RegisterClient Component
 * Allows admin users to register new clients in the clinic system
 * Automatically generates unique client ID (LMC-XXXXXX) upon registration
 */
export function RegisterClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sex: '',
    age: '',
    address: '',
    clinicalSummary: '',
    operationTeam: '',
    refDoctor: '',
  })

  /**
   * Handles form input changes
   * Updates the formData state with new values
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  /**
   * Handles select dropdown changes
   * Updates the formData state with selected value
   */
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.sex || !formData.age) {
      toast.error('Please fill in all required fields (Name, Sex, Age)')
      return
    }

    setLoading(true)

    try {
      // Prepare data for API
      // Split operationTeam string into array if present
      const submissionData = {
        ...formData,
        clinicalSummary: formData.clinicalSummary?.trim() || 'NO SUMMARY',
        operationTeam: formData.operationTeam
          ? formData.operationTeam.split(',').map(item => item.trim()).filter(item => item !== '')
          : [],
      }

      // Send POST request to create new client
      const response = await apiFetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to register client')
        return
      }

      // Success: Show client ID and redirect
      toast.success(`Client registered successfully! ID: ${result.data.clientId}`)

      // Redirect to the client's report page to create a new report
      // We assume the route structure /client/[clientId] exists and shows the client details/reports
      setTimeout(() => {
        router.push(`/client/${result.data.clientId}`)
      }, 1000)

    } catch (error) {
      console.error('Error registering client:', error)
      toast.error('An error occurred while registering the client')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-2">Register New Client</h1>
        <p className="text-gray-600 mb-6">Fill in the client details below. A unique ID (LMC-END-0001...) will be automatically generated.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Client full name"
                  required
                />
              </div>

              {/* Sex Field - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sex <span className="text-red-500">*</span>
                </label>
                <Select value={formData.sex} onValueChange={(value) => handleSelectChange('sex', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sex" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Field - Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Age in years"
                  min="0"
                  max="150"
                  required
                />
              </div>

              {/* Address Field - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Client address"
                />
              </div>
            </div>
          </div>

          {/* Clinical Information Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Clinical Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reg. Doc Field */}
              <div>
                <label className="block text-sm font-medium mb-2">Reg. Doc (Requesting Doctor)</label>
                <AutocompleteInput
                  name="refDoctor"
                  value={formData.refDoctor}
                  onChange={handleInputChange}
                  field="refDoctor"
                  placeholder="Dr. Name"
                />
              </div>

              {/* Operation Team */}
              <div>
                <label className="block text-sm font-medium mb-2">Operation Team</label>
                <AutocompleteInput
                  name="operationTeam"
                  value={formData.operationTeam}
                  onChange={handleInputChange}
                  field="operationTeam"
                  placeholder="Dr. A, Nurse B (comma separated)"
                />
              </div>

              {/* Clinical Summary */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Clinical Summary</label>
                <AutocompleteTextarea
                  name="clinicalSummary"
                  value={formData.clinicalSummary}
                  onChange={handleInputChange}
                  field="clinicalSummary"
                  placeholder="NO SUMMARY"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6 flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {loading ? 'Registering...' : 'Register Client'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: '',
                  sex: '',
                  age: '',
                  address: '',
                  clinicalSummary: '',
                  operationTeam: '',
                  refDoctor: '',
                })
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
