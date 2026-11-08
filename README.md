# BOMI KWON 포트폴리오

## 미리보기
프로젝트 폴더에서 실행한 뒤 http://localhost:8000 접속
```
python3 -m http.server 8000
```
(info 폴더의 json/md를 불러오기 때문에 html 파일을 더블클릭하면 내용이 안 보입니다. GitHub Pages·Netlify 등에 올리면 그대로 동작합니다.)

## 수정하는 곳
| 내용 | 파일 |
|---|---|
| 작품 정보·사진 목록·영상 링크 | `info/works.json` |
| 작품 설명글 | `info/2023.md` ~ `info/2026.md` (빈 줄 = 문단 구분) |
| ABOUT 글 | `info/artiststatement.md` (`제목 : 본문` 형식이 번호 항목이 됩니다) |

## 영상 넣기
`info/works.json`에서 `null`을 링크로 바꾸면 됩니다. 유튜브·비메오 링크 또는 mp4 파일 경로 모두 가능.

- **BOMI KWON(첫 화면) 대표 영상** → 맨 위 `"featured"`의 `"video"`
  ```json
  "featured": { "workId": "we-live-by-eating-one-another", "video": "https://youtu.be/XXXXXXXXXXX" }
  ```
  영상이 없으면 `workId` 작품의 첫 사진이 대신 보입니다. 아래 캡션도 이 작품 정보로 표시됩니다.
- **작품별 영상** → 각 작품의 `"video"`. 영상이 있으면 작품 맨 위에 영상이 오고, 사진은 모두 그 아래로 내려갑니다.

## 사진 추가/교체
1. 원본을 `info/images/`에 넣고 `works.json`의 `"images"` 목록에 파일명 추가 (순서대로 표시)
2. 웹용 압축본 생성: `sh scripts/optimize-images.sh` (→ `assets/images/`)
   압축본이 없으면 원본을 대신 불러오므로 깨지지는 않지만 느려집니다.
