"use client";

import { useRouter } from "next/navigation";
import { getProfilePhotoUrl } from "../utils/imageUtils";

interface ProfileHeaderProps {
  name?: string;
  role?: string;
  profilePhoto?: string;
}

export default function ProfileHeader({ name, role, profilePhoto }: ProfileHeaderProps) {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <div
      className="fixed top-3.5 right-10 flex items-center space-x-3 bg-white rounded-full px-3 py-1 shadow-lg z-30 cursor-pointer border border-blue-700 focus:ring-5 focus:ring-blue-700 transition hover:scale-105 transform"
      onClick={handleProfileClick}
      title="View Profile"
    >
      {profilePhoto ? (
        <img src={getProfilePhotoUrl(profilePhoto)} alt="Profile" className="w-8 h-8 rounded-full" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-white text-sm font-bold">{name?.charAt(0).toUpperCase() || "U"}</span>
        </div>
      )}
      <div className="text-sm text-blue-900">
        <div className="font-bold">{name || "User"}</div>
        <div className="text-xs text-gray-500">{role || "Role"}</div>
      </div>
    </div>
  );
}