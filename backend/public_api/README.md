# Public API Documentation

## Overview

The Public API allows registered users to access their product data programmatically using API keys. This is perfect for integrating your product inventory into your own websites, mobile apps, or third-party services.

## Getting Started

### 1. Generate Your API Key

After registering and logging into your account:

1. Navigate to the API management section
2. Create a new API key (each user can have one API key)
3. Copy and securely store your API key

### 2. Authentication

All public API requests require authentication using your API key in the Authorization header:

```
Authorization: Bearer pak_your_api_key_here
```

### 3. Base URL

```
https://yourdomain.com/api/public/
```

## API Endpoints

### Get All Products

**GET** `/api/public/products/`

Retrieve all active products for your account.

**Headers:**

```
Authorization: Bearer pak_your_api_key_here
Content-Type: application/json
```

**Query Parameters:**

- `category__name` (string): Filter by category name
- `has_variants` (boolean): Filter products with/without variants
- `is_active` (boolean): Filter by active status

**Example Request:**

```bash
curl -X GET "https://yourdomain.com/api/public/products/?category__name=Electronics" \
  -H "Authorization: Bearer pak_your_api_key_here" \
  -H "Content-Type: application/json"
```

**Example Response:**

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Smartphone XYZ",
      "details": "Latest smartphone with advanced features",
      "location": "Warehouse A",
      "category_name": "Electronics",
      "supplier_name": "Tech Supplier Inc",
      "has_variants": true,
      "buy_price": "500.00",
      "sell_price": "750.00",
      "stock": 0,
      "profit_margin": 50.0,
      "total_stock": 45,
      "main_photo": "https://yourdomain.com/media/products/smartphone.jpg",
      "photos": [
        {
          "id": 1,
          "image": "https://yourdomain.com/media/products/smartphone.jpg",
          "alt_text": "Smartphone front view",
          "order": 0
        }
      ],
      "variants": [
        {
          "id": 1,
          "color": "Black",
          "size": "64GB",
          "custom_variant": null,
          "buy_price": "500.00",
          "sell_price": "750.00",
          "stock": 20,
          "created_at": "2025-07-20T10:30:00Z",
          "updated_at": "2025-07-20T10:30:00Z"
        }
      ],
      "is_active": true,
      "created_at": "2025-07-20T10:00:00Z",
      "updated_at": "2025-07-20T10:30:00Z"
    }
  ]
}
```

### Get Single Product

**GET** `/api/public/products/{id}/`

Retrieve details of a specific product by ID.

**Headers:**

```
Authorization: Bearer pak_your_api_key_here
Content-Type: application/json
```

**Example Request:**

```bash
curl -X GET "https://yourdomain.com/api/public/products/1/" \
  -H "Authorization: Bearer pak_your_api_key_here" \
  -H "Content-Type: application/json"
```

**Example Response:**

```json
{
  "id": 1,
  "name": "Smartphone XYZ",
  "details": "Latest smartphone with advanced features",
  "location": "Warehouse A",
  "category_name": "Electronics",
  "supplier_name": "Tech Supplier Inc",
  "has_variants": true,
  "buy_price": "500.00",
  "sell_price": "750.00",
  "stock": 0,
  "profit_margin": 50.0,
  "total_stock": 45,
  "main_photo": "https://yourdomain.com/media/products/smartphone.jpg",
  "photos": [...],
  "variants": [...],
  "is_active": true,
  "created_at": "2025-07-20T10:00:00Z",
  "updated_at": "2025-07-20T10:30:00Z"
}
```

## API Key Management Endpoints

These endpoints require regular authentication (login token) and are used to manage your API keys.

### List/Create API Keys

**GET/POST** `/api/public/manage/api-keys/`

**Headers:**

```
Authorization: Token your_login_token_here
Content-Type: application/json
```

**Create API Key Request:**

```bash
curl -X POST "https://yourdomain.com/api/public/manage/api-keys/" \
  -H "Authorization: Token your_login_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website API Key",
    "requests_per_hour": 500,
    "requests_per_day": 5000
  }'
```

### Regenerate API Key

**POST** `/api/public/manage/api-keys/regenerate/`

Regenerate your existing API key (invalidates the old one).

### API Usage Statistics

**GET** `/api/public/manage/api-keys/usage-stats/`

Get detailed usage statistics for your API key.

**Example Response:**

```json
{
  "api_key": "pak_abcd1234...",
  "is_active": true,
  "created_at": "2025-07-20T09:00:00Z",
  "last_used": "2025-07-20T14:30:00Z",
  "rate_limits": {
    "requests_per_hour": 1000,
    "requests_per_day": 10000
  },
  "stats_last_30_days": {
    "total_requests": 1250,
    "successful_requests": 1200,
    "failed_requests": 50,
    "success_rate": 96.0
  },
  "daily_usage_last_7_days": [
    {
      "date": "2025-07-14",
      "requests": 45
    },
    ...
  ]
}
```

## Rate Limits

Each API key has configurable rate limits:

- **Default**: 1,000 requests per hour, 10,000 requests per day
- **Customizable**: You can adjust these limits when creating your API key
- **Headers**: Rate limit information is included in response headers

When you exceed the rate limit, you'll receive a `429 Too Many Requests` response.

## Error Responses

### Authentication Errors

**401 Unauthorized:**

```json
{
  "detail": "Invalid or inactive API key."
}
```

### Rate Limit Exceeded

**429 Too Many Requests:**

```json
{
  "detail": "Rate limit exceeded. Maximum 1000 requests per hour."
}
```

### Not Found

**404 Not Found:**

```json
{
  "detail": "Not found."
}
```

## Integration Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

const API_KEY = "pak_your_api_key_here";
const BASE_URL = "https://yourdomain.com/api/public";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Get all products
async function getProducts() {
  try {
    const response = await api.get("/products/");
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error.response.data);
  }
}

// Get specific product
async function getProduct(productId) {
  try {
    const response = await api.get(`/products/${productId}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching product:", error.response.data);
  }
}
```

### PHP

```php
<?php

class ProductAPI {
    private $baseUrl;
    private $apiKey;

    public function __construct($baseUrl, $apiKey) {
        $this->baseUrl = $baseUrl;
        $this->apiKey = $apiKey;
    }

    private function makeRequest($endpoint) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . $endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            return json_decode($response, true);
        }

        throw new Exception('API request failed with code: ' . $httpCode);
    }

    public function getProducts($filters = []) {
        $endpoint = '/products/';
        if (!empty($filters)) {
            $endpoint .= '?' . http_build_query($filters);
        }
        return $this->makeRequest($endpoint);
    }

    public function getProduct($productId) {
        return $this->makeRequest("/products/{$productId}/");
    }
}

// Usage
$api = new ProductAPI('https://yourdomain.com/api/public', 'pak_your_api_key_here');
$products = $api->getProducts(['category__name' => 'Electronics']);
?>
```

### Python

```python
import requests

class ProductAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def get_products(self, filters=None):
        params = filters or {}
        response = self.session.get(f'{self.base_url}/products/', params=params)
        response.raise_for_status()
        return response.json()

    def get_product(self, product_id):
        response = self.session.get(f'{self.base_url}/products/{product_id}/')
        response.raise_for_status()
        return response.json()

# Usage
api = ProductAPI('https://yourdomain.com/api/public', 'pak_your_api_key_here')
products = api.get_products({'category__name': 'Electronics'})
```

## Security Best Practices

1. **Keep your API key secure**: Never expose it in client-side code
2. **Use HTTPS**: Always use HTTPS for API requests
3. **Regenerate regularly**: Regenerate your API key periodically
4. **Monitor usage**: Regularly check your API usage statistics
5. **Implement rate limiting**: Be respectful of rate limits in your applications

## Support

For API support or questions, please contact the development team or check the documentation in your dashboard.
