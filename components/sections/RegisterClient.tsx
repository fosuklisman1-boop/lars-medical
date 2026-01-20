'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

/**
 * RegisterClient Component
 * Allows admin users to register new clients in the clinic system
 * Automatically generates unique client ID (LMC-XXXXXX) upon registration
 */
export function RegisterClient() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sex: '',
    age: '',
    address: '',
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

  /**
   * Handles form submission
   * Sends client data to API and creates new client with unique ID
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.sex || !formData.age) {
      toast.error('Please fill in all required fields (Name, Sex, Age)')
      return
    }

    setLoading(true)

    try {
      // Send POST request to create new client
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to register client')
        return
      }

      // Success: Show client ID and reset form
      toast.success(`Client registered successfully! ID: ${result.data.clientId}`)

      // Reset form to initial state
      setFormData({
        name: '',
        sex: '',
        age: '',
        address: '',
      })
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
        <p className="text-gray-600 mb-6">Fill in the client details below. A unique ID (LMC-XXXXXX) will be automatically generated.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="border-t pt-6">
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
