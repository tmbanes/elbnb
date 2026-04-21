import Link from 'next/link'
<<<<<<< HEAD
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/auth')
  }
=======
import { redirect } from 'next/navigation'
import { ProfileUpload } from './ProfileUpload'
import { getApiAuthenticatedUser } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'

export default async function DashboardPage() {
  const auth = await getApiAuthenticatedUser()
  if ("error" in auth) {
    redirect("/");
  };

  const user = auth.user;
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your dashboard.</p>
      </div>

<<<<<<< HEAD
=======
      {/* Profile Picture Upload */}
      <ProfileUpload initialProfileUrl={user.profile_picture_url} />

      {/* User Details */}
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">User Details</h2>

        <div>
          <p className="text-sm text-gray-500">Full Name</p>
          <p className="text-gray-900 font-medium">
            {user.first_name} {user.middle_name ? `${user.middle_name} ` : ''}{user.last_name}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Email</p>
          <p className="text-gray-900 font-medium">{user.email}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Role</p>
          <p className="text-gray-900 font-medium">{user.role}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">User Status</p>
          <p className="text-gray-900 font-medium">{user.user_status}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Sex</p>
          <p className="text-gray-900 font-medium">{user.sex}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Birthdate</p>
          <p className="text-gray-900 font-medium">{user.birthdate}</p>
        </div>
      </div>

<<<<<<< HEAD
      <div className="flex gap-4">
=======
      {/* Navigation Links */}
      <div className="flex gap-4 flex-wrap">
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
        <Link href="/dashboard/accommodations">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Accommodations
          </button>
        </Link>

        <Link href="/dashboard/applications">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Applications
          </button>
        </Link>

        <Link href="/dashboard/assignments">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Assignments
          </button>
        </Link>

<<<<<<< HEAD
        {/*for ADMIN ONLY housing */}
        <Link href ="/dashboard/admin/housing">
=======
        {/* for ADMIN ONLY housing */}
        <Link href="/dashboard/admin/housing">
>>>>>>> 76e8f3255db7be2b6cbe835d611a2e1be74975e1
          <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
            Housing (ADMIN)
          </button>
        </Link>
      </div>
    </div>
  )
}