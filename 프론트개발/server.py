from flask import Flask, render_template, request, redirect, url_for, jsonify, make_response
from functools import wraps
import os
import requests
import jwt

app = Flask(__name__)

# 파일 저장 경로 설정
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 기본 라우트 설정
def create_app():
    static_folder = os.path.join(os.getcwd(), 'static')
    if not os.path.exists(static_folder):
        os.makedirs(static_folder)
    return app

SECRET_KEY = 'JwTsEcReTkEyOrHaShInG'

def authenticate_token(func):
    """JWT 인증 데코레이터"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.cookies.get('jwt')  # 클라이언트가 보낸 JWT 토큰
        if not token:
            return jsonify({"success": False, "message": "로그인이 필요합니다."}), 401

        try:
            # 토큰 검증
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user = decoded_token  # 디코딩된 사용자 정보를 요청에 추가
            return func(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "토큰이 만료되었습니다. 다시 로그인해주세요."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "유효하지 않은 토큰입니다."}), 401

    return wrapper

@app.route('/check_login_status', methods=['GET'])
def check_login_status():
    """로그인 상태 확인"""
    token = request.cookies.get('jwt')  # 클라이언트가 보낸 JWT 토큰
    if not token:
        return jsonify({"success": False, "message": "로그인되지 않았습니다."})

    try:
        # JWT 토큰 검증
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({"success": True, "user": decoded_token})
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "토큰이 만료되었습니다. 다시 로그인하세요."})
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "유효하지 않은 토큰입니다."})
    
@app.route('/')
def main_page():
    # Node.js 백엔드 API URL
    api_url = 'https://teamproject-jv72.onrender.com/api/main'

    # Query parameters (optional: category, sortBy)
    params = {
        'category': request.args.get('category', 'IT'),
        'sortBy': request.args.get('sortBy', 'latest')
    }

    try:
        # Node.js 백엔드 API 호출
        response = requests.get(api_url, params=params)
        response.raise_for_status()  # HTTP 오류 발생 시 예외 처리
        group_data = response.json()  # JSON 데이터 변환
    except requests.exceptions.RequestException as e:
        # API 호출 실패 시 기본 데이터 처리
        group_data = {"error": "Failed to fetch data", "details": str(e)}

    # 데이터를 템플릿에 전달
    return render_template('./main.html', groups=group_data) 


@app.route('/login', methods=['POST'])
def login():
    """로그인 엔드포인트: Node.js로부터 JWT를 전달받아 처리"""
    print("로그인 요청 들어옴!")  # 디버깅용 로그

    # 클라이언트에서 전달된 로그인 데이터 가져오기
    data = request.get_json()
    userNum = data.get('userNum')
    password = data.get('password')

    # Node.js 백엔드 API 호출
    api_url = 'https://teamproject-jv72.onrender.com/api/login'
    print("Node.js로 요청 보내기 전:", userNum, password)

    try:
        # Node.js에 로그인 요청
        response = requests.post(api_url, json={'userNum': userNum, 'password': password})
        response.raise_for_status()

        if response.status_code == 200:
            # Node.js에서 반환된 데이터
            node_response = response.json()
            print("Node.js 응답 데이터:", node_response)

            # Node.js가 반환한 JWT 토큰 확인
            token = node_response.get('token')
            if not token:
                return jsonify({"success": False, "message": "Node.js에서 토큰을 받지 못했습니다."}), 500

            # JWT를 클라이언트 쿠키에 저장
            flask_response = make_response(jsonify({"success": True, "message": "로그인 성공"}))
            flask_response.set_cookie('jwt', token, httponly=True, samesite='Strict', secure=True)
            return flask_response
        else:
            return jsonify({"success": False, "message": response.json().get('message', '로그인 실패')}), response.status_code
    except requests.exceptions.RequestException as e:
        print("Node.js API 호출 실패:", e)
        return jsonify({"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}), 500


@app.route('/mypage')
@authenticate_token
def mypage():
    """사용자 정보 페이지"""
    user_info = request.user  # JWT에서 디코딩된 사용자 정보 사용
    return render_template('mypage.html', user=user_info)

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        # 사용자 입력 데이터 가져오기
        user_data = {
            'userNum': request.form.get('id'),
            'name': request.form.get('name'),
            'email': request.form.get('email'),
            'password': request.form.get('password'),
            'category': request.form.getlist('club_interest')  # 다중 선택 가능
        }

        # 파일 가져오기
        file = request.files.get('MSI_Image')
        if not file:
            return "MSI 사진을 업로드하세요.", 400

        # Node.js 백엔드로 요청 보내기
        api_url = 'https://teamproject-jv72.onrender.com/api/register'
        try:
            response = requests.post(
                api_url,
                data=user_data,
                files={'MSI_Image': (file.filename, file.stream, file.content_type)}
            )
            response.raise_for_status()  # HTTP 오류 발생 시 예외 처리

            # 성공 시 메시지 출력
            if response.status_code == 201:
                return redirect(url_for('main_page'))  # 메인 페이지로 리다이렉트
            else:
                return response.json().get('message', '알 수 없는 오류가 발생했습니다.')
        except requests.exceptions.RequestException as e:
            print("API 호출 실패:", e)
            return f"API 호출 실패: {e}", 500

    # GET 요청 시 회원가입 페이지 렌더링
    return render_template('signup.html')

@app.route('/qa')
def qa_page():
    return render_template('Q&A.html')

@app.route('/update_info', methods=['POST'])
@authenticate_token
def update_info():
    """사용자 정보 수정"""
    user_data = request.get_json()
    updated_info = {
        "userNum": request.user['userNum'],  # JWT에서 사용자 ID 추출
        "name": user_data.get('name'),
        "email": user_data.get('email'),
        "category": user_data.get('category')
    }

    api_url = 'https://teamproject-jv72.onrender.com/api/update_info'
    try:
        response = requests.post(api_url, json=updated_info)
        response.raise_for_status()

        if response.status_code == 200:
            return {"success": True, "message": "정보가 수정되었습니다."}
        else:
            return {"success": False, "message": response.json().get("message", "정보 수정 실패")}
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return {"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}, 500

@app.route('/change_password', methods=['POST'])
@authenticate_token
def change_password():
    """비밀번호 변경"""
    data = request.get_json()
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')

    api_url = 'https://teamproject-jv72.onrender.com/api/change_password'
    try:
        response = requests.post(
            api_url,
            json={
                "userNum": request.user['userNum'],  # JWT에서 사용자 ID 추출
                "currentPassword": current_password,
                "newPassword": new_password
            }
        )
        response.raise_for_status()

        if response.status_code == 200:
            return {"success": True, "message": "비밀번호가 변경되었습니다."}
        else:
            return {"success": False, "message": response.json().get("message", "비밀번호 변경 실패")}
    except requests.exceptions.RequestException as e:
        print("API 호출 실패:", e)
        return {"success": False, "message": "서버와 통신 중 오류가 발생했습니다."}, 500

club_list = []  # 임시 데이터 저장소

@app.route('/get_clubs', methods=['GET'])  # '/get_clubs' URL에 대한 GET 요청 처리
def get_clubs():
    # 클라이언트로부터 전달된 'category' 파라미터를 가져옵니다.
    # 기본값은 'all'로 설정되어, 카테고리가 지정되지 않으면 전체 동아리를 반환합니다.
    category = request.args.get('category', 'all')

    if category == 'all':
        # 카테고리가 'all'일 경우, 모든 동아리 데이터를 반환
        filtered_clubs = club_list
    else:
        # 특정 카테고리가 지정된 경우, 해당 카테고리에 속하는 동아리만 필터링
        filtered_clubs = [club for club in club_list if club['category'] == category]

    # 클라이언트에게 JSON 형식으로 필터링된 동아리 데이터를 반환
    # 반환 데이터 형식: {"clubs": [동아리 데이터 목록]}
    return {"clubs": filtered_clubs}

@app.route('/register_club', methods=['GET', 'POST'])
def register_club():
    if request.method == 'GET':
        # GET 요청 시 클라이언트에 HTML 페이지 반환
        return render_template('club_register.html')

    elif request.method == 'POST':
        # 클라이언트에서 전송된 데이터 가져오기
        data = request.get_json()

        # Node.js API로 동아리 등록 요청
        api_url = 'https://teamproject-jv72.onrender.com/api/group_form'
        try:
            response = requests.post(api_url, json=data)  # 데이터를 Node.js로 전송
            response.raise_for_status()

            if response.status_code == 201:  # Node.js API가 성공적으로 처리된 경우
                new_club = response.json()  # Node.js에서 반환된 동아리 데이터
                club_list.append(new_club)  # 로컬 메모리 리스트에 추가 (임시)
                return {"success": True, "message": "동아리 등록 완료", "data": new_club}
            else:
                return {"success": False, "message": response.json().get("message", "동아리 등록 실패")}
        except requests.exceptions.RequestException as e:
            print("Node.js API 호출 실패:", e)
            return {"success": False, "message": "서버와의 통신 중 오류가 발생했습니다."}, 500


@app.route('/get_club_details', methods=['GET'])
def get_club_details():
    club_id = request.args.get('id')  # URL에서 ID 가져오기
    if not club_id:
        return {"success": False, "message": "동아리 ID가 필요합니다."}, 400

    try:
        # 동아리 ID로 해당 동아리 검색
        club = next((club for club in club_list if club['id'] == int(club_id)), None)
        if club:
            return {"success": True, "club": club}
        else:
            return {"success": False, "message": "해당 동아리를 찾을 수 없습니다."}, 404
    except ValueError:
        return {"success": False, "message": "유효하지 않은 동아리 ID입니다."}, 400

@app.route('/logout', methods=['POST'])
def logout():
    """로그아웃 엔드포인트"""
    response = make_response(jsonify({"success": True, "message": "로그아웃 성공"}))
    response.delete_cookie('jwt')  # JWT 쿠키 삭제
    return response

# 배포 준비
if __name__ == "__main__":
    # 템플릿 폴더와 정적 파일 경로 설정
    app = create_app()
    app.template_folder = os.getcwd()
    app.static_folder = os.path.join(os.getcwd(), 'static')

    # 서버 시작
    app.run(host='0.0.0.0', port=5000, debug=True)
