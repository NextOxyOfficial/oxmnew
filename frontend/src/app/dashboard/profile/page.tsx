"use client";

import { useState, useEffect } from "react";
import { ApiService } from "../../../lib/api";

interface ProfileData {
	user: {
		id: number;
		username: string;
		email: string;
		first_name: string;
		last_name: string;
		date_joined: string;
		last_login: string;
	};
	profile: {
		company: string;
		company_address: string;
		phone: string;
		contact_number: string;
		address: string;
		store_logo: string;
		banner_image: string;
	};
}

export default function ProfilePage() {
	const [profileData, setProfileData] = useState<ProfileData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setSisSaving] = useState(false);
	const [editForm, setEditForm] = useState({
		first_name: "",
		last_name: "",
		email: "",
		company: "",
		company_address: "",
		phone: "",
		contact_number: "",
		address: "",
	});

	useEffect(() => {
		fetchProfile();
	}, []);

	const fetchProfile = async () => {
		try {
			const data = await ApiService.getProfile();
			setProfileData(data);
			setEditForm({
				first_name: data.user.first_name || "",
				last_name: data.user.last_name || "",
				email: data.user.email || "",
				company: data.profile.company || "",
				company_address: data.profile.company_address || "",
				phone: data.profile.phone || "",
				contact_number: data.profile.contact_number || "",
				address: data.profile.address || "",
			});
		} catch (error) {
			console.error("Failed to fetch profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleCancel = () => {
		setIsEditing(false);
		if (profileData) {
			setEditForm({
				first_name: profileData.user.first_name || "",
				last_name: profileData.user.last_name || "",
				email: profileData.user.email || "",
				company: profileData.profile.company || "",
				company_address: profileData.profile.company_address || "",
				phone: profileData.profile.phone || "",
				contact_number: profileData.profile.contact_number || "",
				address: profileData.profile.address || "",
			});
		}
	};

	const handleSave = async () => {
		try {
			setSisSaving(true);
			await ApiService.updateProfile(editForm);
			await fetchProfile();
			setIsEditing(false);
		} catch (error) {
			console.error("Failed to update profile:", error);
			alert("Failed to update profile. Please try again.");
		} finally {
			setSisSaving(false);
		}
	};

	const handleInputChange = (field: string, value: string) => {
		setEditForm(prev => ({
			...prev,
			[field]: value
		}));
	};

	const handleImageUpload = async (type: 'logo' | 'banner', file: File) => {
		try {
			if (type === 'logo') {
				await ApiService.uploadStoreLogo(file);
			} else {
				await ApiService.uploadBannerImage(file);
			}
			await fetchProfile();
		} catch (error) {
			console.error(`Failed to upload ${type}:`, error);
			alert(`Failed to upload ${type}. Please try again.`);
		}
	};

	const handleRemoveImage = async (type: 'logo' | 'banner') => {
		try {
			if (type === 'logo') {
				await ApiService.removeStoreLogo();
			} else {
				await ApiService.removeBannerImage();
			}
			await fetchProfile();
		} catch (error) {
			console.error(`Failed to remove ${type}:`, error);
			alert(`Failed to remove ${type}. Please try again.`);
		}
	};

	if (loading) {
		return (
			<div className="w-full max-w-4xl mx-auto sm:p-6 p-2">
				<div className="text-center">
					<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
						Profile
					</h1>
					<p className="text-gray-400">Loading profile...</p>
				</div>
			</div>
		);
	}

	if (!profileData) {
		return (
			<div className="w-full max-w-4xl mx-auto sm:p-6 p-2">
				<div className="text-center">
					<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
						Profile
					</h1>
					<p className="text-red-400">Failed to load profile data.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto sm:p-6 p-2 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
					Profile
				</h1>
				{!isEditing ? (
					<button
						onClick={handleEdit}
						className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition-colors"
					>
						✏️ Edit Profile
					</button>
				) : (
					<div className="flex gap-2">
						<button
							onClick={handleSave}
							disabled={isSaving}
							className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
						>
							💾 {isSaving ? "Saving..." : "Save"}
						</button>
						<button
							onClick={handleCancel}
							disabled={isSaving}
							className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
						>
							❌ Cancel
						</button>
					</div>
				)}
			</div>

			{/* Profile Card */}
			<div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-6">
				{/* Account Information */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						👤 Account Information
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Username
							</label>
							<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
								{profileData.user.username}
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Email
							</label>
							{isEditing ? (
								<input
									type="email"
									value={editForm.email}
									onChange={(e) => handleInputChange("email", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 flex items-center gap-2">
									📧 {profileData.user.email || "Not provided"}
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								First Name
							</label>
							{isEditing ? (
								<input
									type="text"
									value={editForm.first_name}
									onChange={(e) => handleInputChange("first_name", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
									{profileData.user.first_name || "Not provided"}
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Last Name
							</label>
							{isEditing ? (
								<input
									type="text"
									value={editForm.last_name}
									onChange={(e) => handleInputChange("last_name", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
									{profileData.user.last_name || "Not provided"}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Contact Information */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						📞 Contact Information
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Phone
							</label>
							{isEditing ? (
								<input
									type="tel"
									value={editForm.phone}
									onChange={(e) => handleInputChange("phone", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
									placeholder="Enter phone number"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
									{profileData.profile.phone || "Not provided"}
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Contact Number
							</label>
							{isEditing ? (
								<input
									type="tel"
									value={editForm.contact_number}
									onChange={(e) => handleInputChange("contact_number", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
									placeholder="Enter contact number"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
									{profileData.profile.contact_number || "Not provided"}
								</div>
							)}
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Address
							</label>
							{isEditing ? (
								<textarea
									value={editForm.address}
									onChange={(e) => handleInputChange("address", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
									placeholder="Enter your address"
									rows={3}
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 flex items-start gap-2 min-h-[80px]">
									📍 {profileData.profile.address || "Not provided"}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Business Information */}
				<div className="mb-8">
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						🏢 Business Information
					</h2>
					<div className="grid grid-cols-1 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Company Name
							</label>
							{isEditing ? (
								<input
									type="text"
									value={editForm.company}
									onChange={(e) => handleInputChange("company", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
									placeholder="Enter company name"
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300">
									{profileData.profile.company || "Not provided"}
								</div>
							)}
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-1">
								Company Address
							</label>
							{isEditing ? (
								<textarea
									value={editForm.company_address}
									onChange={(e) => handleInputChange("company_address", e.target.value)}
									className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
									placeholder="Enter company address"
									rows={3}
								/>
							) : (
								<div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-300 min-h-[80px]">
									{profileData.profile.company_address || "Not provided"}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Images */}
				<div>
					<h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
						🖼️ Images
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Store Logo */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Store Logo
							</label>
							<div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
								{profileData.profile.store_logo ? (
									<div className="space-y-3">
										<img
											src={profileData.profile.store_logo}
											alt="Store Logo"
											className="mx-auto max-h-32 rounded-lg"
										/>
										<div className="flex gap-2 justify-center">
											<label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm transition-colors">
												Change
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImageUpload('logo', file);
													}}
												/>
											</label>
											<button
												onClick={() => handleRemoveImage('logo')}
												className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
											>
												🗑️ Remove
											</button>
										</div>
									</div>
								) : (
									<div className="py-8">
										<div className="text-gray-400 text-2xl mb-2">🖼️</div>
										<p className="text-gray-400 text-sm mb-3">No logo uploaded</p>
										<label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
											Upload Logo
											<input
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) handleImageUpload('logo', file);
												}}
											/>
										</label>
									</div>
								)}
							</div>
						</div>

						{/* Banner Image */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Banner Image
							</label>
							<div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
								{profileData.profile.banner_image ? (
									<div className="space-y-3">
										<img
											src={profileData.profile.banner_image}
											alt="Banner Image"
											className="mx-auto max-h-32 rounded-lg"
										/>
										<div className="flex gap-2 justify-center">
											<label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm transition-colors">
												Change
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => {
														const file = e.target.files?.[0];
														if (file) handleImageUpload('banner', file);
													}}
												/>
											</label>
											<button
												onClick={() => handleRemoveImage('banner')}
												className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
											>
												🗑️ Remove
											</button>
										</div>
									</div>
								) : (
									<div className="py-8">
										<div className="text-gray-400 text-2xl mb-2">🖼️</div>
										<p className="text-gray-400 text-sm mb-3">No banner uploaded</p>
										<label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
											Upload Banner
											<input
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];
													if (file) handleImageUpload('banner', file);
												}}
											/>
										</label>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Account Stats */}
				<div className="mt-8 pt-6 border-t border-white/10">
					<h2 className="text-lg font-semibold text-white mb-4">📊 Account Stats</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div className="bg-white/5 rounded-lg p-3">
							<span className="text-gray-400">Member since:</span>
							<span className="text-white ml-2">
								{new Date(profileData.user.date_joined).toLocaleDateString()}
							</span>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<span className="text-gray-400">Last login:</span>
							<span className="text-white ml-2">
								{profileData.user.last_login ? 
									new Date(profileData.user.last_login).toLocaleDateString() : 
									"Never"
								}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
