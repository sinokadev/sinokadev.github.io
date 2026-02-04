import os
import sys
from datetime import datetime, timezone
import re

def create_post():
    # 1. 제목 입력
    if len(sys.argv) < 2:
        title = input("포스트 제목을 입력하세요: ")
    else:
        title = sys.argv[1]

    # 2. 시간 설정 (ISO 8601 형식)
    # .replace(microsecond=0)으로 밀리초는 깔끔하게 제거하고, 
    # .astimezone()을 붙여서 로컬 타임존 정보를 포함해.
    now = datetime.now().astimezone().replace(microsecond=0)
    iso_date = now.isoformat() 
    
    # 파일명용 날짜 (가독성을 위해 날짜만 사용)
    file_date = now.strftime("%Y-%m-%d")
    
    # 3. 파일명 및 슬러그 생성
    slug = re.sub(r'\W+', '-', title.lower()).strip('-')
    file_name = f"{file_date}-{slug}.md"
    
    target_dir = "src/content/blog"
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    file_path = os.path.join(target_dir, file_name)

    # 4. Frontmatter 템플릿 (pubDate에 ISO 8601 적용)
    template = f"""---
title: "{title}"
pubDate: {iso_date}
description: ""
---

글 내용을 여기에 적으세요.
"""

    # 5. 파일 쓰기
    if os.path.exists(file_path):
        print(f"이미 파일이 존재합니다: {file_path}")
    else:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(template)
        print(f"ISO 8601 타임스탬프로 생성 완료: {file_path}")
        print(f"설정된 시간: {iso_date}")

if __name__ == "__main__":
    create_post()