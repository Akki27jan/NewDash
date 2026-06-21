import urllib.request
import urllib.parse
import json
import random
import string

base_url = "https://newdash-ciq9.onrender.com/api"

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase, k=length))

email = f"test_{random_string()}@example.com"

# 1. Signup
data = json.dumps({
    "first_name": "API",
    "last_name": "Tester",
    "email": email,
    "password": "password123"
}).encode('utf-8')
req = urllib.request.Request(f"{base_url}/auth/signup", data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print("Signup:", response.status)
except urllib.error.HTTPError as e:
    print("Signup error:", e.code, e.read().decode())

# 2. Login
data = json.dumps({
    "email": email,
    "password": "password123"
}).encode('utf-8')
req = urllib.request.Request(f"{base_url}/auth/login", data=data, headers={'Content-Type': 'application/json'})
cookie = None
try:
    with urllib.request.urlopen(req) as response:
        print("Login:", response.status)
        cookie = response.headers.get('Set-Cookie')
except urllib.error.HTTPError as e:
    print("Login error:", e.code, e.read().decode())

# 3. Create Subject
data = json.dumps({
    "subject_name": "Test Subject",
    "credits": 4.0,
    "description": "A test subject",
    "expected_gpa": 4.0
}).encode('utf-8')
req = urllib.request.Request(f"{base_url}/subjects/", data=data, headers={'Content-Type': 'application/json'})
if cookie:
    req.add_header('Cookie', cookie)
try:
    with urllib.request.urlopen(req) as response:
        print("Create Subject:", response.status, response.read().decode())
except urllib.error.HTTPError as e:
    print("Create Subject error:", e.code, e.read().decode())

# 4. Get Subjects
req = urllib.request.Request(f"{base_url}/subjects/")
if cookie:
    req.add_header('Cookie', cookie)
try:
    with urllib.request.urlopen(req) as response:
        print("Subjects:", response.status, response.read().decode())
except urllib.error.HTTPError as e:
    print("Subjects error:", e.code, e.read().decode())
