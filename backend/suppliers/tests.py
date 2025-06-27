from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Supplier


class SupplierModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_supplier_creation(self):
        supplier = Supplier.objects.create(
            name='Test Supplier',
            email='supplier@example.com',
            phone='1234567890',
            user=self.user
        )
        self.assertEqual(supplier.name, 'Test Supplier')
        self.assertEqual(supplier.user, self.user)
        self.assertTrue(supplier.is_active)

    def test_supplier_str_method(self):
        supplier = Supplier.objects.create(
            name='Test Supplier',
            user=self.user
        )
        self.assertEqual(str(supplier), 'Test Supplier')


class SupplierAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_supplier(self):
        data = {
            'name': 'New Supplier',
            'email': 'new@supplier.com',
            'phone': '9876543210',
            'address': '123 Supplier St'
        }
        response = self.client.post('/api/suppliers/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Supplier.objects.count(), 1)
        
    def test_list_suppliers(self):
        Supplier.objects.create(name='Supplier 1', user=self.user)
        Supplier.objects.create(name='Supplier 2', user=self.user)
        
        response = self.client.get('/api/suppliers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
