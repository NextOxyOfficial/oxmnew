import requests
import json

# Base URL for the API
BASE_URL = 'http://127.0.0.1:8000/api'


def test_employees_api():
    print("Testing Employees API Endpoints...\n")

    # Test 1: Get all employees
    print("1. Testing GET /api/employees/")
    try:
        response = requests.get(f'{BASE_URL}/employees/')
        if response.status_code == 200:
            employees = response.json()
            print(f"✅ Success! Found {len(employees)} employees")
            if employees:
                print(
                    f"   First employee: {employees[0]['name']} ({employees[0]['employee_id']})")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Get employee stats
    print("\n2. Testing GET /api/employees/stats/")
    try:
        response = requests.get(f'{BASE_URL}/employees/stats/')
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Success! Stats: {json.dumps(stats, indent=2)}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Get specific employee details
    print("\n3. Testing GET /api/employees/6/")
    try:
        response = requests.get(f'{BASE_URL}/employees/6/')
        if response.status_code == 200:
            employee = response.json()
            print(f"✅ Success! Employee: {employee['name']}")
            print(
                f"   Total incentives: ${employee.get('total_incentives', 0)}")
            print(
                f"   Completion rate: {employee.get('completion_rate', 0):.1f}%")
            print(f"   Pending tasks: {employee.get('pending_tasks', 0)}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 4: Get employee incentives
    print("\n4. Testing GET /api/employees/6/incentives/")
    try:
        response = requests.get(f'{BASE_URL}/employees/6/incentives/')
        if response.status_code == 200:
            incentives = response.json()
            print(f"✅ Success! Found {len(incentives)} incentives")
            for incentive in incentives:
                print(
                    f"   - {incentive['title']}: ${incentive['amount']} ({incentive['status']})")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 5: Get employee tasks
    print("\n5. Testing GET /api/employees/6/tasks/")
    try:
        response = requests.get(f'{BASE_URL}/employees/6/tasks/')
        if response.status_code == 200:
            tasks = response.json()
            print(f"✅ Success! Found {len(tasks)} tasks")
            for task in tasks:
                print(
                    f"   - {task['title']}: {task['status']} ({task['priority']} priority)")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 6: Get employee salary records
    print("\n6. Testing GET /api/employees/6/salary_records/")
    try:
        response = requests.get(f'{BASE_URL}/employees/6/salary_records/')
        if response.status_code == 200:
            records = response.json()
            print(f"✅ Success! Found {len(records)} salary records")
            for record in records:
                print(
                    f"   - {record['month']} {record['year']}: ${record['net_salary']} ({record['status']})")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 7: Get employee payment info
    print("\n7. Testing GET /api/employees/6/payment_info/")
    try:
        response = requests.get(f'{BASE_URL}/employees/6/payment_info/')
        if response.status_code == 200:
            payment_info = response.json()
            print(f"✅ Success! Bank: {payment_info.get('bank_name', 'N/A')}")
            print(
                f"   Payment method: {payment_info.get('payment_method', 'N/A')}")
        else:
            print(f"❌ Failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_employees_api()
