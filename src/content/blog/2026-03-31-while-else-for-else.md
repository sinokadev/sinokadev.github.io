---
title: "YouKnowPython [while-else, for-else]"
pubDate: 2026-03-31T19:44:38+09:00
description: "while, for의 숨겨진 사용법, while-else, for-else에 대한 글입니다."
---

`else`는 루프에도 사용 가능하다는 것을 알고 계셨나요? 지금부터 알아보겠습니다.

## for-else

`for` 실행중 `break` 문이 실행되지 않았다면 `else`가 실행됩니다.

### 예시

#### 소수 판별

```py
for n in range(2, 10):
    for x in range(2, n):
        if n % x == 0:
            print(n, 'equals', x, '*', n//x)
            break
    else:
        # loop fell through without finding a factor
        print(n, 'is a prime number')
```
<small>출처: https://docs.python.org/3/tutorial/controlflow.html#else-clauses-on-loops</small>

이 예제는 소수를 찾습니다. `n` 나누기 `x`의 나머지가 0이라면 `n`에는 자기 자신과 1을 제외한 약수가 있는 것이므로 `n`은 소수가 아닙니다. 따라서 약수를 출력한 후, `break` 됩니다.  
하지만 약수가 없다면 (`2~n-1` 범위의 모든 숫자에 대해 `n % x`가 0이 아니라면) `break`가 실행되지 않았으므로 `else`로 넘어가서 해당 숫자가 소수라고 표시합니다.

#### 리스트 내의 특정 숫자

```py
numbers = [1, 2, 3]
for n in numbers:
    if n == 2:
        print("2를 찾았습니다!")
        break
else:
    print("리스트 끝까지 확인했지만 2가 없네요.")
```

이 예제에서는 `n`이 2라면 `break` 합니다. 따라서 리스트 내에 2가 없다면 `else`로 넘어가 "리스트 끝까지 확인했지만 2가 없네요."가 출력됩니다.

## while-else

`while-else` 또한 `for-else`와 비슷한 논리로 작동합니다. 루프 조건이 `False`가 되어 정상 종료되면 `else`가 실행되지만, `break`로 강제 종료되면 `else`는 실행되지 않습니다.

### 예시

```py
count = 5
while count > 0:
    print(f"남은 횟수: {count}")
    count -= 1
else:
    print("발사! (조건이 False가 되어 else 실행)")
```

이 경우에는 `else`가 실행되지만,

```py
count = 5
while True:
    if count <= 0:
        break
    print(f"남은 횟수: {count}")
    count -= 1
else:
    print("발사! (조건이 False가 되어 else 실행)")
```

이 경우에는 `else`가 실행되지 않습니다.