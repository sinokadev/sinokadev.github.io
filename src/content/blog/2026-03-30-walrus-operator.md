---
title: "YouKnowPython [Walrus Operator]"
pubDate: 2026-03-30T05:15:17+09:00
description: "대입 표현식, 바다코끼리 연산자에 대한 설명입니다."
tags: ["YouKnowPython", "프로그래밍"]
---

사용 가능: `Python 3.8+`

## 대입 표현식

Python 3.8 버전에 추가된 이 문법은 변수에 값을 할당하는 표현식입니다. 쉽게 설명하자면, 변수에 값을 할당한 후 그 값을 반환합니다.

### 예시

#### 기존 방식

```py
line = input("입력하세요: ")
while line != "quit":
    print(f"입력값: {line}")
    line = input("입력하세요: ") # 중복 코드 발생
```

#### 대입 표현식 활용

```py
while (line := input("입력하세요: ")) != "quit":
    print(f"입력값: {line}")
```

#### 응용

이 예에서, 대입 표현식은 len()을 두 번 호출하지 않도록 돕습니다.

```py
if (n := len(a)) > 10:
    print(f"List is too long ({n} elements, expected <= 10)")
```
<small>출처: https://docs.python.org/ko/3.13/whatsnew/3.8.html</small>

더 자세한 예시는 [Python Docs](https://docs.python.org/ko/3.13/whatsnew/3.8.html#assignment-expressions)와 [PEP 572 문서](https://peps.python.org/pep-0572/)를 참고하십시오.

---

새로운 시리즈 YouKnowPython입니다. 유용하고 잘 알려지지 않은 파이썬 문법과 테크닉을 소개하는 시리즈입니다.

도움이 되었다면 댓글 부탁드립니다.