const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BACKEND_BASE_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Auth token management
export const AuthToken = {
	get: () => {
		if (typeof window === "undefined") return null;
		try {
			return localStorage.getItem("auth_token");
		} catch {
			return null;
		}
	},
	set: (token: string) => {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem("auth_token", token);
		} catch {
			// Silently fail if localStorage is not available
		}
	},
	remove: () => {
		if (typeof window === "undefined") return;
		try {
			localStorage.removeItem("auth_token");
		} catch {
			// Silently fail if localStorage is not available
		}
	},
};

export class ApiService {
	private static async request(endpoint: string, options: RequestInit = {}) {
		const url = `${API_BASE_URL}${endpoint}`;
		const token = AuthToken.get();

		const headers: HeadersInit = {};

		// Only set Content-Type for non-FormData requests
		if (!(options.body instanceof FormData)) {
			(headers as Record<string, string>)["Content-Type"] = "application/json";
		}

		// Add custom headers
		if (options.headers) {
			Object.assign(headers, options.headers);
		}

		// Only add Authorization header if token exists and not explicitly disabled
		const skipAuth =
			options.headers &&
			"Authorization" in options.headers &&
			(options.headers as Record<string, unknown>)["Authorization"] === null;
		if (token && !skipAuth) {
			(headers as Record<string, string>)["Authorization"] = `Token ${token}`;
		}

		const config: RequestInit = {
			...options,
			headers,
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				let errorMessage = `HTTP error! status: ${response.status}`;
				let errorDetails = null;
				try {
					const errorData = await response.json();
					errorDetails = errorData;
					errorMessage = errorData.error || errorData.detail || errorMessage;

					// If it's a validation error, show field-specific errors
					if (response.status === 400 && errorData) {
						const fieldErrors = [];
						for (const [field, errors] of Object.entries(errorData)) {
							if (Array.isArray(errors)) {
								fieldErrors.push(`${field}: ${errors.join(", ")}`);
							} else if (typeof errors === "string") {
								fieldErrors.push(`${field}: ${errors}`);
							}
						}
						if (fieldErrors.length > 0) {
							errorMessage = fieldErrors.join("; ");
						}
					}
				} catch {
					// If response is not JSON, use status text
					errorMessage = response.statusText || errorMessage;
				}
				const error = new Error(errorMessage);
				(error as Error & { details?: unknown }).details = errorDetails;
				throw error;
			}

			// Handle 204 No Content responses (like DELETE operations)
			if (response.status === 204) {
				return null;
			}

			const result = await response.json();
			return result;
		} catch (error) {
			console.error("API request failed:", error);
			if (
				error instanceof TypeError &&
				error.message.includes("Failed to fetch")
			) {
				throw new Error(
					"Unable to connect to server. Please check if the backend is running."
				);
			}
			throw error;
		}
	}

	static async get(endpoint: string) {
		return this.request(endpoint, { method: "GET" });
	}

	static async post(endpoint: string, data: unknown) {
		return this.request(endpoint, {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	static async put(endpoint: string, data: unknown) {
		return this.request(endpoint, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	static async patch(endpoint: string, data: unknown) {
		return this.request(endpoint, {
			method: "PATCH",
			body: JSON.stringify(data),
		});
	}

	static async delete(endpoint: string) {
		return this.request(endpoint, { method: "DELETE" });
	}

	// General API methods
	static async healthCheck() {
		return this.request("/health/", {
			method: "GET",
			headers: { Authorization: null as unknown as string }, // No auth needed
		});
	}

	static async getApiRoot() {
		return this.request("/", {
			method: "GET",
			headers: { Authorization: null as unknown as string }, // No auth needed
		});
	}

	// Authentication methods
	static async register(userData: {
		username: string;
		email: string;
		password: string;
		first_name?: string;
		last_name?: string;
	}) {
		const response = await this.request("/auth/register/", {
			method: "POST",
			body: JSON.stringify(userData),
		});

		if (response.token) {
			AuthToken.set(response.token);
		}

		return response;
	}

	static async login(credentials: { username: string; password: string }) {
		const response = await this.request("/auth/login/", {
			method: "POST",
			body: JSON.stringify(credentials),
		});

		if (response.token) {
			AuthToken.set(response.token);
		}

		return response;
	}

	static async logout() {
		try {
			await this.post("/auth/logout/", {});
		} finally {
			AuthToken.remove();
		}
	}

	static async getProfile() {
		return this.get("/auth/profile/");
	}

	static async updateProfile(profileData: {
		first_name?: string;
		last_name?: string;
		email?: string;
		company?: string;
		company_address?: string;
		phone?: string;
		contact_number?: string;
		address?: string;
	}) {
		return this.put("/auth/profile/", profileData);
	}

	static async uploadStoreLogo(file: File) {
		const formData = new FormData();
		formData.append("store_logo", file);

		return this.request("/auth/profile/upload-logo/", {
			method: "POST",
			body: formData,
		});
	}

	static async uploadBannerImage(file: File) {
		const formData = new FormData();
		formData.append("banner_image", file);

		return this.request("/auth/profile/upload-banner/", {
			method: "POST",
			body: formData,
		});
	}

	static async removeStoreLogo() {
		return this.delete("/auth/profile/remove-logo/");
	}

	static async removeBannerImage() {
		return this.delete("/auth/profile/remove-banner/");
	}

	// Category methods
	static async getCategories() {
		return this.get("/categories/");
	}

	static async createCategory(categoryData: {
		name: string;
		description?: string;
	}) {
		return this.post("/categories/", categoryData);
	}

	static async updateCategory(
		categoryId: number,
		categoryData: {
			name?: string;
			description?: string;
			is_active?: boolean;
		}
	) {
		return this.put(`/categories/${categoryId}/`, categoryData);
	}

	static async deleteCategory(categoryId: number) {
		return this.delete(`/categories/${categoryId}/`);
	}

	static async toggleCategory(categoryId: number) {
		return this.put(`/categories/${categoryId}/toggle/`, {});
	}

	// Settings methods
	static async getSettings() {
		return this.get("/auth/settings/");
	}

	static async updateSettings(settingsData: {
		language?: string;
		currency?: string;
		email_notifications?: boolean;
		marketing_notifications?: boolean;
	}) {
		return this.put("/auth/settings/", settingsData);
	}

	static async changePassword(passwordData: {
		current_password: string;
		new_password: string;
		confirm_password: string;
	}) {
		return this.post("/auth/change-password/", passwordData);
	}

	static async requestPasswordReset() {
		return this.post("/auth/request-password-reset/", {});
	}

	// Gift methods
	static async getGifts() {
		return this.get("/gifts/");
	}

	static async createGift(giftData: { name: string; is_active?: boolean }) {
		return this.post("/gifts/", giftData);
	}

	static async updateGift(
		giftId: number,
		giftData: {
			name?: string;
			is_active?: boolean;
		}
	) {
		return this.put(`/gifts/${giftId}/`, giftData);
	}

	static async deleteGift(giftId: number) {
		return this.delete(`/gifts/${giftId}/`);
	}

	static async toggleGift(giftId: number) {
		return this.put(`/gifts/${giftId}/toggle/`, {});
	}

	// Achievement methods
	static async getAchievements() {
		return this.get("/achievements/");
	}

	static async createAchievement(achievementData: {
		name?: string;
		type: "orders" | "amount";
		value: number;
		points: number;
		is_active?: boolean;
	}) {
		return this.post("/achievements/", achievementData);
	}

	static async updateAchievement(
		achievementId: number,
		achievementData: {
			name?: string;
			type?: "orders" | "amount";
			value?: number;
			points?: number;
			is_active?: boolean;
		}
	) {
		return this.put(`/achievements/${achievementId}/`, achievementData);
	}

	static async deleteAchievement(achievementId: number) {
		return this.delete(`/achievements/${achievementId}/`);
	}

	static async toggleAchievement(achievementId: number) {
		return this.put(`/achievements/${achievementId}/toggle/`, {});
	}

	// Level methods
	static async getLevels() {
		return this.get("/levels/");
	}

	static async createLevel(levelData: { name: string; is_active?: boolean }) {
		return this.post("/levels/", levelData);
	}

	static async updateLevel(
		levelId: number,
		levelData: {
			name?: string;
			is_active?: boolean;
		}
	) {
		return this.put(`/levels/${levelId}/`, levelData);
	}

	static async deleteLevel(levelId: number) {
		return this.delete(`/levels/${levelId}/`);
	}

	static async toggleLevel(levelId: number) {
		return this.put(`/levels/${levelId}/toggle/`, {});
	}

	// Brand methods
	static async getBrands() {
		return this.get("/brands/");
	}

	static async createBrand(brandData: { name: string; is_active?: boolean }) {
		return this.post("/brands/", brandData);
	}

	static async updateBrand(
		brandId: number,
		brandData: {
			name?: string;
		 is_active?: boolean;
		}
	) {
		return this.put(`/brands/${brandId}/`, brandData);
	}

	static async deleteBrand(brandId: number) {
		return this.delete(`/brands/${brandId}/`);
	}

	static async toggleBrand(brandId: number) {
		return this.put(`/brands/${brandId}/toggle/`, {});
	}

	// Payment Method methods
	static async getPaymentMethods() {
		return this.get("/payment-methods/");
	}

	static async createPaymentMethod(paymentMethodData: {
		name: string;
		is_active?: boolean;
	}) {
		return this.post("/payment-methods/", paymentMethodData);
	}

	static async updatePaymentMethod(
		paymentMethodId: number,
		paymentMethodData: {
			name?: string;
			is_active?: boolean;
		}
	) {
		return this.put(`/payment-methods/${paymentMethodId}/`, paymentMethodData);
	}

	static async deletePaymentMethod(paymentMethodId: number) {
		return this.delete(`/payment-methods/${paymentMethodId}/`);
	}

	static async togglePaymentMethod(paymentMethodId: number) {
		return this.put(`/payment-methods/${paymentMethodId}/toggle/`, {});
	}

	// Suppliers methods
	static async createSupplier(supplierData: {
		name: string;
		address?: string;
		phone?: string;
		email?: string;
		website?: string;
		contact_person?: string;
		notes?: string;
	}) {
		return this.post("/suppliers/", supplierData);
	}

	static async updateSupplier(
		id: number,
		supplierData: {
			name?: string;
			address?: string;
			phone?: string;
			email?: string;
			website?: string;
			contact_person?: string;
			notes?: string;
		}
	) {
		return this.put(`/suppliers/${id}/`, supplierData);
	}

	static async deleteSupplier(id: number) {
		return this.delete(`/suppliers/${id}/`);
	}

	static async activateSupplier(id: number) {
		return this.post(`/suppliers/${id}/activate/`, {});
	}

	static async deactivateSupplier(id: number) {
		return this.post(`/suppliers/${id}/deactivate/`, {});
	}

	// Products methods
	static async getProducts() {
		return this.get("/products/");
	}

	static async getProduct(id: number) {
		return this.get(`/products/${id}/`);
	}

	static async createProduct(productData: {
		name: string;
		category?: number;
		supplier?: number;
		location: string;
		details?: string;
		hasVariants: boolean;
		buyPrice?: number;
		sellPrice?: number;
		stock?: number;
		colorSizeVariants?: Array<{
			id?: string;
			color: string;
			size: string;
			weight?: number;
			weight_unit?: string;
			custom_variant?: string;
			buyPrice: number;
			sellPrice: number;
			stock: number;
		}>;
		photos?: File[];
	}) {
		const formData = new FormData();

		// Add basic product data
		formData.append("name", productData.name);
		formData.append("location", productData.location);
		formData.append("hasVariants", productData.hasVariants.toString());

		if (productData.category) {
			formData.append("category", productData.category.toString());
		}

		if (productData.supplier) {
			formData.append("supplier", productData.supplier.toString());
		}

		if (productData.details) {
			formData.append("details", productData.details);
		}

		if (!productData.hasVariants) {
			if (productData.buyPrice) {
				formData.append("buyPrice", productData.buyPrice.toString());
			}
			if (productData.sellPrice) {
				formData.append("sellPrice", productData.sellPrice.toString());
			}
			if (productData.stock !== undefined && productData.stock !== null) {
				formData.append("stock", productData.stock.toString());
			}
		}

		// Add variants data as JSON string
		if (productData.hasVariants && productData.colorSizeVariants) {
			// Transform the variants to match backend field names
			const transformedVariants = productData.colorSizeVariants.map(
				(variant) => ({
					color: variant.color || "",
					size: variant.size || "",
					weight: variant.weight,
					weight_unit: variant.weight_unit,
					custom_variant: variant.custom_variant,
					buyPrice: variant.buyPrice, // Backend expects camelCase for these
					sellPrice: variant.sellPrice,
					stock: variant.stock,
				})
			);

			formData.append("colorSizeVariants", JSON.stringify(transformedVariants));
		}

		// Add photos
		if (productData.photos && productData.photos.length > 0) {
			productData.photos.forEach((photo) => {
				formData.append("photos", photo);
			});
		}

		return this.request("/products/", {
			method: "POST",
			body: formData,
		});
	}

	static async updateProduct(
		id: number,
		productData: {
			name?: string;
			category?: number;
			supplier?: number;
			location?: string;
			details?: string;
			hasVariants?: boolean;
			buy_price?: number;
			sell_price?: number;
			stock?: number;
			is_active?: boolean;
		}
	) {
		return this.put(`/products/${id}/`, productData);
	}

	static async deleteProduct(id: number) {
		return this.delete(`/products/${id}/`);
	}

	static async addProductVariant(
		productId: number,
		variantData: {
			color: string;
			size: string;
			weight?: number;
			weight_unit?: string;
			custom_variant?: string;
			buy_price: number;
			sell_price: number;
			stock: number;
		}
	) {
		return this.post(`/products/${productId}/add_variant/`, variantData);
	}

	static async updateProductVariant(
		productId: number,
		variantId: number,
		variantData: {
			color?: string;
			size?: string;
			weight?: number;
			weight_unit?: string;
			custom_variant?: string;
			buy_price?: number;
			sell_price?: number;
			stock?: number;
		}
	) {
		return this.patch(
			`/products/${productId}/variants/${variantId}/`,
			variantData
		);
	}

	static async deleteProductVariant(productId: number, variantId: number) {
		return this.delete(`/products/${productId}/variants/${variantId}/`);
	}

	static async addProductPhotos(productId: number, photos: File[]) {
		const formData = new FormData();
		photos.forEach((photo) => {
			formData.append("photos", photo);
		});

		return this.request(`/products/${productId}/add_photos/`, {
			method: "POST",
			body: formData,
		});
	}

	static async deleteProductPhoto(productId: number, photoId: number) {
		return this.delete(`/products/${productId}/photos/${photoId}/`);
	}

	static async adjustProductStock(
		productId: number,
		adjustmentData: {
			variant_id?: number;
			quantity: number;
			reason?: string;
			notes?: string;
		}
	) {
		return this.post(`/products/${productId}/adjust_stock/`, adjustmentData);
	}

	static async getProductStatistics() {
		return this.get("/products/statistics/");
	}

	// Product Sales methods
	static async getProductSales() {
		return this.get("/sales/");
	}

	static async createProductSale(saleData: {
		product: number;
		variant?: number;
		quantity: number;
		unit_price: number;
		customer_name?: string;
		customer_phone?: string;
		customer_email?: string;
		notes?: string;
	}) {
		return this.post("/sales/", saleData);
	}

	static async getProductSaleStatistics() {
		return this.get("/sales/statistics/");
	}

	// Stock Movement methods
	static async getStockMovements() {
		return this.get("/stock-movements/");
	}

	// Purchase methods
	static async getPurchases() {
		try {
			const result = await this.get("/purchases/");
			return result;
		} catch (error) {
			console.error("Error in getPurchases:", error);
			throw error;
		}
	}

	static async createPurchase(purchaseData: {
		supplier: number;
		date: string;
		amount: number;
		status: "pending" | "completed" | "cancelled";
		products: string;
		notes?: string;
		proof_document?: File;
	}) {
		const formData = new FormData();
		formData.append("supplier", purchaseData.supplier.toString());
		formData.append("date", purchaseData.date);
		formData.append("amount", purchaseData.amount.toString());
		formData.append("status", purchaseData.status);
		formData.append("products", purchaseData.products);

		if (purchaseData.notes) {
			formData.append("notes", purchaseData.notes);
		}

		if (purchaseData.proof_document) {
			formData.append("proof_document", purchaseData.proof_document);
		}

		return this.request("/purchases/", {
			method: "POST",
			body: formData,
		});
	}

	static async updatePurchase(
		id: number,
		purchaseData: {
			supplier?: number;
			date?: string;
			amount?: number;
			status?: "pending" | "completed" | "cancelled";
			products?: string;
			notes?: string;
			proof_document?: File;
		}
	) {
		// If we have a file, use FormData
		if (purchaseData.proof_document) {
			const formData = new FormData();

			if (purchaseData.supplier) {
				formData.append("supplier", purchaseData.supplier.toString());
			}
			if (purchaseData.date) {
				formData.append("date", purchaseData.date);
			}
			if (purchaseData.amount) {
				formData.append("amount", purchaseData.amount.toString());
			}
			if (purchaseData.status) {
				formData.append("status", purchaseData.status);
			}
			if (purchaseData.products) {
				formData.append("products", purchaseData.products);
			}
			if (purchaseData.notes) {
				formData.append("notes", purchaseData.notes);
			}
			formData.append("proof_document", purchaseData.proof_document);

			return this.request(`/purchases/${id}/`, {
				method: "PUT",
				body: formData,
			});
		} else {
			// For simple updates like status, use JSON
			const updateData: Record<string, unknown> = {};

			if (purchaseData.supplier) updateData.supplier = purchaseData.supplier;
			if (purchaseData.date) updateData.date = purchaseData.date;
			if (purchaseData.amount) updateData.amount = purchaseData.amount;
			if (purchaseData.status) updateData.status = purchaseData.status;
			if (purchaseData.products) updateData.products = purchaseData.products;
			if (purchaseData.notes) updateData.notes = purchaseData.notes;

			return this.patch(`/purchases/${id}/`, updateData);
		}
	}

	static async deletePurchase(id: number) {
		return this.delete(`/purchases/${id}/`);
	}

	// Payment methods
	static async getPayments() {
		try {
			const result = await this.get("/payments/");
			return result;
		} catch (error) {
			console.error("Error in getPayments:", error);
			throw error;
		}
	}

	static async createPayment(paymentData: {
		supplier: number;
		date: string;
		amount: number;
		method: "cash" | "card" | "bank_transfer" | "check";
		status: "pending" | "completed" | "failed";
		reference?: string;
		notes?: string;
		proof_document?: File;
	}) {
		const formData = new FormData();
		formData.append("supplier", paymentData.supplier.toString());
		formData.append("date", paymentData.date);
		formData.append("amount", paymentData.amount.toString());
		formData.append("method", paymentData.method);
		formData.append("status", paymentData.status);

		if (paymentData.reference) {
			formData.append("reference", paymentData.reference);
		}

		if (paymentData.notes) {
			formData.append("notes", paymentData.notes);
		}

		if (paymentData.proof_document) {
			formData.append("proof_document", paymentData.proof_document);
		}

		return this.request("/payments/", {
			method: "POST",
			body: formData,
		});
	}

	static async updatePayment(
		id: number,
		paymentData: {
			supplier?: number;
			date?: string;
			amount?: number;
			method?: "cash" | "card" | "bank_transfer" | "check";
			status?: "pending" | "completed" | "failed";
			reference?: string;
			notes?: string;
			proof_document?: File;
		}
	) {
		// If we have a file, use FormData
		if (paymentData.proof_document) {
			const formData = new FormData();

			if (paymentData.supplier) {
				formData.append("supplier", paymentData.supplier.toString());
			}
			if (paymentData.date) {
				formData.append("date", paymentData.date);
			}
			if (paymentData.amount) {
				formData.append("amount", paymentData.amount.toString());
			}
			if (paymentData.method) {
				formData.append("method", paymentData.method);
			}
			if (paymentData.status) {
				formData.append("status", paymentData.status);
			}
			if (paymentData.reference) {
				formData.append("reference", paymentData.reference);
			}
			if (paymentData.notes) {
				formData.append("notes", paymentData.notes);
			}
			formData.append("proof_document", paymentData.proof_document);

			return this.request(`/payments/${id}/`, {
				method: "PUT",
				body: formData,
			});
		} else {
			// For simple updates like status, use JSON
			const updateData: Record<string, unknown> = {};

			if (paymentData.supplier) updateData.supplier = paymentData.supplier;
			if (paymentData.date) updateData.date = paymentData.date;
			if (paymentData.amount) updateData.amount = paymentData.amount;
			if (paymentData.method) updateData.method = paymentData.method;
			if (paymentData.status) updateData.status = paymentData.status;
			if (paymentData.reference) updateData.reference = paymentData.reference;
			if (paymentData.notes) updateData.notes = paymentData.notes;

			return this.patch(`/payments/${id}/`, updateData);
		}
	}

	static async deletePayment(id: number) {
		return this.delete(`/payments/${id}/`);
	}

	// Check if user is authenticated
	static isAuthenticated(): boolean {
		return !!AuthToken.get();
	}

	// Helper to get full URL for images
	static getImageUrl(relativePath: string): string {
		if (!relativePath) return "";
		if (relativePath.startsWith("http")) return relativePath;
		return `${BACKEND_BASE_URL}${relativePath}`;
	}

	static async sendSmsNotification(phone: string, message: string) {
		const data = { phone, message };
		return this.post("/send-sms/", data);
	}

	// Subscription API methods
	static async getSubscriptionPlans() {
		return this.get("/plans/");
	}

	static async getSmsPackages() {
		return this.get("/sms-packages/");
	}

	static async getMySubscription() {
		return this.get("/my-subscription/");
	}

	static async getSmsCredits() {
		return this.get("/my-sms-credits/");
	}

	static async getSmsHistory() {
		return this.get("/my-sms-history/");
	}

	static async purchaseSmsPackage(packageId: number) {
		return this.post("/add-sms-credits/", { package_id: packageId });
	}

	static async upgradeSubscription(planId: string) {
		return this.post("/subscription/upgrade/", { plan_id: planId });
	}

	// Notifications
	static async getNotifications() {
		return this.get("/notifications/");
	}
}
