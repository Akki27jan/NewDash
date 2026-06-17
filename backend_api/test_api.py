import requests

base_url = "http://localhost:8000/api"

# 1. Signup
print("Signing up...")
signup_res = requests.post(f"{base_url}/auth/signup", json={
    "first_name": "API",
    "last_name": "Tester",
    "email": "tester_subject@example.com",
    "password": "password123"
})
print("Signup status:", signup_res.status_code, signup_res.text)

# 2. Login
print("Logging in...")
login_res = requests.post(f"{base_url}/auth/login", json={
    "email": "tester_subject@example.com",
    "password": "password123"
})
print("Login status:", login_res.status_code)
cookies = login_res.cookies

# 3. Create Subject
print("Creating subject 1...")
subj1_res = requests.post(f"{base_url}/subjects/", json={
    "subject_name": "Math",
    "credits": 4
}, cookies=cookies)
print("Create Subject 1:", subj1_res.status_code, subj1_res.text)

print("Creating subject 2...")
subj2_res = requests.post(f"{base_url}/subjects/", json={
    "subject_name": "Science",
    "credits": 3
}, cookies=cookies)
print("Create Subject 2:", subj2_res.status_code, subj2_res.text)

# 4. Get Subjects
print("Getting subjects...")
get_res = requests.get(f"{base_url}/subjects/", cookies=cookies)
print("Get Subjects:", get_res.status_code, get_res.text)
