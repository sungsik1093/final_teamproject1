document.addEventListener("DOMContentLoaded", function () {
    //    const phoneInput = document.getElementById("phone");
    const form = document.querySelector("form");
    const passwordInput = document.querySelector("input[name='password']");
    const confirmPasswordInput = document.querySelector("input[name='confirm_password']");
    const clubInterestCheckboxes = document.querySelectorAll("input[name='club_interest']");

    //    phoneInput.addEventListener("input", function () {
    //        // 입력된 값에서 숫자만 남기고 나머지 문자 제거
    //        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, "");
    //    });

    form.addEventListener("submit", function (event) {
        // 전화번호 길이 검사 (예: 10자리 이상)
        //if (phoneInput.value.length < 10) {
        //    alert("전화번호는 최소 10자리여야 합니다.");
        //    event.preventDefault();
        //    return;
        //}

        // 비밀번호 강도 검사 (최소 8자리, 숫자 및 특수문자 포함)
        const password = passwordInput.value;
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            alert("비밀번호는 최소 8자리이며 숫자와 특수문자를 포함해야 합니다.");
            //event.preventDefault();
            return;
        }

        // 비밀번호 확인 검사
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert("비밀번호가 일치하지 않습니다.");
            //event.preventDefault();
            return;
        }

        // 동아리 장르 최소 하나 이상 선택 확인
        const selectedInterests = Array.from(clubInterestCheckboxes).some(checkbox => checkbox.checked);
        if (!selectedInterests) {
            alert("흥미있는 동아리 장르를 최소 하나 이상 선택해주세요.");
            //event.preventDefault();
            return;
        }

        // 가입 완료 메시지 표시
        //event.preventDefault(); // 폼의 기본 동작 방지 (테스트 용도로 사용, 실제 제출 시에는 제거)
        showCompletionMessage();
    });

    // 비밀번호 표시 기능 추가 (비밀번호 확인 필드에만)
    const confirmPasswordToggle = document.createElement("input");
    confirmPasswordToggle.type = "checkbox";
    confirmPasswordToggle.id = "toggleConfirmPassword";
    const confirmPasswordToggleLabel = document.createElement("label");
    confirmPasswordToggleLabel.htmlFor = "toggleConfirmPassword";
    confirmPasswordToggleLabel.textContent = "비밀번호 표시";

    confirmPasswordInput.parentElement.insertAdjacentElement("afterend", confirmPasswordToggleLabel);
    confirmPasswordToggleLabel.insertAdjacentElement("afterend", confirmPasswordToggle);

    confirmPasswordToggle.addEventListener("change", function () {
        if (confirmPasswordToggle.checked) {
            confirmPasswordInput.type = "text";
        } else {
            confirmPasswordInput.type = "password";
        }
    });

    // 가입 완료 메시지 표시 함수
    function showCompletionMessage() {
        const messageDiv = document.createElement("div");
        messageDiv.textContent = "가입신청이 완료되었습니다. 조금만 기다려주세요.";
        messageDiv.style.position = "fixed";
        messageDiv.style.top = "20px";
        messageDiv.style.right = "20px";
        messageDiv.style.padding = "10px";
        messageDiv.style.backgroundColor = "#4CAF50";
        messageDiv.style.color = "#fff";
        messageDiv.style.borderRadius = "5px";
        messageDiv.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.1)";

        document.body.appendChild(messageDiv);

        // 일정 시간 후 메시지 제거
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }
});