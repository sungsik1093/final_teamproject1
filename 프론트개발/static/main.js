// 페이지가 로드될 때 전체 카테고리를 기본으로 표시
document.addEventListener("DOMContentLoaded", function () {
    showCategory('all');
    fetchClubs();
});

// 특정 카테고리만 보여주고 나머지는 숨기는 함수
function showCategory(category) {
    const sections = document.querySelectorAll('.category-content');

    // 모든 섹션을 숨기기
    sections.forEach((section) => {
        section.style.display = 'none';
    });

    // 선택한 카테고리만 표시
    const activeSection = document.getElementById(category);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

// 동아리 목록을 서버에서 가져와 표시
function fetchClubs() {
    fetch('/get_clubs')
        .then(response => response.json())
        .then(data => {
            displayClubs(data.clubs);
        })
        .catch(error => console.error('동아리 목록 가져오기 오류:', error));
}

function displayClubs(clubs) {
    const allSection = document.getElementById('all');
    allSection.innerHTML = ''; // 기존 내용 초기화

    clubs.forEach(club => {
        const clubElement = document.createElement('div');
        clubElement.className = 'club-item';
        clubElement.innerHTML = `
            <h3>${club.name}</h3>
            <p>${club.category} | ${club.description}</p>
            <p class="club-status">${club.status}</p>
        `;

        allSection.appendChild(clubElement);
    });
}

// 페이지 로드 시 동아리 목록 불러오기
document.addEventListener("DOMContentLoaded", fetchClubs);


// 동아리 등록 폼 제출 이벤트
document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("club-register-form");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // 기본 폼 동작 방지

            // 폼 데이터 가져오기
            const formData = new FormData(registerForm);
            const clubData = Object.fromEntries(formData.entries()); // 객체로 변환

            try {
                const response = await fetch("/register_club", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(clubData)
                });
                const data = await response.json();

                if (data.success) {
                    alert(data.message); // 성공 메시지 표시
                    window.location.href = "/"; // 메인 페이지로 이동
                } else {
                    alert("동아리 등록 실패: " + (data.message || "알 수 없는 오류"));
                }
            } catch (error) {
                console.error("동아리 등록 실패:", error);
                alert("서버 오류가 발생했습니다. 다시 시도해주세요.");
            }
        });
    }
});


// 카테고리별 필터링
document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', () => {
        const category = link.textContent.trim();
        fetch(`/get_clubs?category=${category}`)
            .then(response => response.json())
            .then(data => displayClubs(data.clubs))
            .catch(error => console.error('동아리 가져오기 오류:', error));
    });
});

function viewClub(clubId) {
    window.location.href = `/introduceclub.html?id=${clubId}`;
}

document.addEventListener("DOMContentLoaded", function () {
    fetch("/check_login_status", {
        method: "GET",
        credentials: "include" // 쿠키 전송
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // 로그인 상태라면, UI 업데이트
                const userIdInput = document.querySelector("input[type='text']");
                const passwordInput = document.querySelector("input[type='password']");
                const loginButton = document.querySelector(".login-button");
                showLoginSuccessMessage(userIdInput, passwordInput, loginButton);
            } else {
                console.log("로그인 상태가 아닙니다.");
            }
        })
        .catch(error => console.error("로그인 상태 확인 실패:", error));

    const loginButton = document.querySelector(".login-button");
    console.log("찾은 로그인 버튼: ", loginButton);

    if (loginButton) {
        loginButton.addEventListener("click", function () {
            console.log("로그인 버튼 클릭됨"); // 버튼 클릭 로그

            const userIdInput = document.querySelector("input[type='text']");
            const passwordInput = document.querySelector("input[type='password']");
            const userId = userIdInput.value.trim();
            const password = passwordInput.value.trim();

            console.log("로그인 요청 시작: ", { userId, password }); // 로그인 요청 로그

            // 아이디와 비밀번호 입력 확인
            if (!userId || !password) {
                alert("아이디와 비밀번호를 입력해주세요.");
                return;
            }

            // 서버로 로그인 요청 보내기
            fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userNum: userId, password: password })
            })
                .then(response => {
                    console.log("응답 상태 코드: ", response.status); // 응답 상태 로그
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("서버 응답 데이터: ", data); // 서버 응답 로그
                    if (data.success) {
                        alert("로그인 성공");
                        showLoginSuccessMessage(userIdInput, passwordInput, loginButton);
                    } else {
                        alert(data.message || "로그인 실패");
                    }
                })
                .catch(error => {
                    console.error("로그인 요청 실패: ", error); // 요청 실패 로그
                });
        });
    } else {
        console.error("로그인 버튼을 찾을 수 없습니다!");
    }
});


// 로그인 성공 시 입력칸 자리에 메시지 표시
function showLoginSuccessMessage(userIdInput, passwordInput, loginButton) {
    // 입력칸 제거
    userIdInput.style.display = "none";
    passwordInput.style.display = "none";
    loginButton.style.display = "none";

    // 메시지 표시
    const parentElement = document.querySelector(".auth"); // 부모 요소를 명확히 지정
    if (!parentElement) {
        console.error("부모 요소를 찾을 수 없습니다!"); // 디버깅용 로그
        return;
    }

    // 기존 메시지가 있는지 확인 (중복 방지)
    const existingMessage = parentElement.querySelector(".success-message");
    if (existingMessage) {
        console.log("이미 성공 메시지가 표시되어 있습니다.");
        return;
    }

    const successMessage = document.createElement("div");
    successMessage.className = "success-message"; // 중복 방지를 위한 클래스 추가
    successMessage.textContent = "로그인이 되었습니다!";
    successMessage.style.fontSize = "16px";
    successMessage.style.color = "#4CAF50";
    successMessage.style.fontWeight = "bold";
    successMessage.style.marginTop = "10px";

    // 부모 요소에 메시지 삽입
    //const parent = userIdInput.parentElement;
    parentElement.appendChild(successMessage);
}

document.getElementById("update-info-btn").addEventListener("click", function () {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const category = document.getElementById("category").value.split(',').map(item => item.trim());

    // 서버로 수정 요청 전송
    fetch("/update_info", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            email: email,
            category: category
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("정보가 성공적으로 수정되었습니다.");
                location.reload(); // 페이지 새로고침
            } else {
                alert(data.message || "정보 수정에 실패했습니다.");
            }
        })
        .catch(error => {
            console.error("정보 수정 요청 실패:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        });
});

function displayClubs(clubs) {
    const allSection = document.getElementById('all');
    allSection.innerHTML = ''; // 기존 내용 초기화

    clubs.forEach(club => {
        const clubElement = document.createElement('div');
        clubElement.className = 'club-item';
        clubElement.innerHTML = `
            <h3>${club.name}</h3>
            <p>${club.category} | ${club.description}</p>
            <p class="club-status">${club.status}</p>
            <button onclick="viewClub(${club.id})">자세히 보기</button>
        `;
        allSection.appendChild(clubElement);
    });
}

function viewClub(clubId) {
    // 동아리 정보를 보여줄 페이지로 이동
    window.location.href = `/introduceclub.html?id=${clubId}`;
}
