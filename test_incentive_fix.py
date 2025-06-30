import requests
import json

# Test incentive creation with employee-specific endpoint


def test_incentive_creation():
    BASE_URL = "http://127.0.0.1:8000/api"

    # Test data
    employee_id = 6  # Assuming we have an employee with ID 6
    incentive_data = {
        "title": "Test Bonus",
        "description": "Test incentive creation",
        "amount": 1000.00,
        "type": "bonus",
        "status": "pending"
    }

    print(f"Testing incentive creation for employee {employee_id}...")
    print(f"URL: {BASE_URL}/employees/{employee_id}/incentives/")
    print(f"Data: {json.dumps(incentive_data, indent=2)}")

    try:
        response = requests.post(
            f"{BASE_URL}/employees/{employee_id}/incentives/",
            json=incentive_data,
            headers={"Content-Type": "application/json"}
        )

        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 201:
            print("✅ Incentive created successfully!")
            incentive = response.json()
            print(f"Created incentive ID: {incentive['id']}")
            return incentive['id']
        else:
            print("❌ Failed to create incentive")
            return None

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


if __name__ == "__main__":
    test_incentive_creation()
