# Webcam Object, Face, and Gesture Detection

이 프로젝트는 논문의 시연용으로 제작되었으며 웹캠을 이용한 객체, 얼굴, 손 제스처 감지 기능을 제공합니다. 또한, 포커스 스코어가 70% 이상일 때 combo 카운트를 증가시키고, 70% 이하로 3초 이상 지속되면 combo 카운트를 초기화하는 기능을 포함하고 있습니다.

## Features

- **객체 감지**: 웹캠을 통해 데이터를 수집 후 분석하며 객체를 감지합니다.
- **얼굴 및 제스처 감지**: 얼굴의 특징과 제스처를 감지합니다.
- **Combo 카운트**: 포커스 스코어가 70% 이상일 때 combo 카운트가 증가하고, 70% 이하로 3초 이상 지속되면 combo 카운트를 초기화합니다. combo 카운트는 화면의 우측 하단에 표시되며, TailwindCSS의 Bounce 애니메이션이 적용됩니다.

## 사용 스택 (Tech Stack)

- **React.js**: 사용자 인터페이스를 구축하기 위한 라이브러리
- **TypeScript**: 자바스크립트에 타입을 추가하여 코드의 품질을 향상
- **TailwindCSS**: 유틸리티-퍼스트 CSS 프레임워크
- **TensorFlow.js**: 머신러닝 모델을 웹에서 실행하기 위한 라이브러리
- **BodyPix**: 사람의 포즈를 감지하는 모델

## 설치 및 실행 방법

1. **레포지토리 클론**
   ```sh
   git clone https://github.com/your-repository-url.git
   cd your-repository-url
   ```

2. **필요한 패키지 설치**
   ```sh
   npm install
   ```

3. **개발 서버 실행**
   ```sh
   npm run dev
   ```

4. **웹 브라우저에서 프로젝트 열기**
   브라우저에서 `http://localhost:3000`으로 이동하여 프로젝트를 확인할 수 있습니다.

## 프로젝트 구조

- **src/components**: UI 컴포넌트가 위치한 폴더입니다.
- **src/hooks**: 커스텀 훅이 위치한 폴더입니다.
- **src/types**: TypeScript 타입 정의가 위치한 폴더입니다.

## 주요 파일 설명

- **App.tsx**: 주요 로직이 구현된 파일입니다. 객체 감지, 얼굴 및 제스처 감지, combo 카운트 기능이 이 파일에 포함되어 있습니다.
- **components/Button.tsx**: 버튼 컴포넌트입니다.
- **components/DetectionResults.tsx**: 객체 감지 결과를 표시하는 컴포넌트입니다.
- **components/FaceBlendShapes.tsx**: 얼굴 특징을 표시하는 컴포넌트입니다.
- **components/GestureResults.tsx**: 제스처 감지 결과를 표시하는 컴포넌트입니다.
- **components/NavigationBar.tsx**: 네비게이션 바 컴포넌트입니다.
- **components/ScoreResults.tsx**: 포커스 스코어와 관련된 결과를 표시하는 컴포넌트입니다.

## Combo 기능 설명

- **Combo 카운트**: 포커스 스코어가 70% 이상일 때 combo 카운트가 증가합니다. combo 카운트는 화면의 우측 하단에 표시되며, TailwindCSS의 Bounce 애니메이션이 적용됩니다.
- **카운트 초기화**: 포커스 스코어가 70% 이하로 3초 이상 지속될 경우 combo 카운트가 0으로 초기화됩니다.

