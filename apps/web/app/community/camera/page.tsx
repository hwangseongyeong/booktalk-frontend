"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@booktalk/api-client";
import { useRequireAuth } from "../../../lib/useRequireAuth";

type Facing = "environment" | "user";
type Phase = "loading" | "live" | "error" | "captured" | "uploading";

export default function CameraCapturePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-black" />}>
      <CameraCaptureInner />
    </Suspense>
  );
}

function CameraCaptureInner() {
  const ready = useRequireAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookLabel = searchParams.get("book") ?? "책 선택";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [facing, setFacing] = useState<Facing>("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shot, setShot] = useState<{ url: string; blob: Blob } | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  // 카메라 스트림을 멈추고 트랙을 정리한다.
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // 카메라 스트림을 시작한다(현재 facing 기준).
  const startStream = useCallback(
    async (mode: Facing) => {
      setPhase("loading");
      setErrorMsg(null);
      stopStream();
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("이 브라우저에서는 카메라를 사용할 수 없어요.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
        streamRef.current = stream;
        setTorchOn(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setPhase("live");
      } catch {
        setErrorMsg("카메라에 접근할 수 없어요. 권한을 허용했는지 확인해주세요.");
        setPhase("error");
      }
    },
    [stopStream],
  );

  useEffect(() => {
    if (!ready) return;
    startStream(facing);
    return () => stopStream();
    // facing 변경 시 재시작은 flip 핸들러에서 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return null;

  // 카메라 전/후면 전환
  async function flipCamera() {
    const next: Facing = facing === "environment" ? "user" : "environment";
    setFacing(next);
    await startStream(next);
  }

  // 플래시(토치) 토글 — 지원 기기에서만 동작(주로 모바일 후면).
  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const next = !torchOn;
      // torch는 아직 표준 MediaTrackConstraints 타입에 없어 캐스팅으로 접근(지원 기기 한정).
      await track.applyConstraints({ advanced: [{ torch: next }] } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      window.alert("이 기기에서는 플래시를 지원하지 않아요.");
    }
  }

  // 현재 프레임을 캡처해 미리보기로 전환
  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || phase !== "live") return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setShot({ url, blob });
        setPhase("captured");
        stopStream();
      },
      "image/jpeg",
      0.9,
    );
  }

  // 다시 찍기
  async function retake() {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    await startStream(facing);
  }

  // 촬영본 업로드 → 기록 작성 화면으로 사진 URL 전달
  async function usePhoto() {
    if (!shot) return;
    setPhase("uploading");
    try {
      const file = new File([shot.blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const { url } = await apiClient.uploadImage(file);
      URL.revokeObjectURL(shot.url);
      router.push(`/community/record?image=${encodeURIComponent(url)}`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "업로드에 실패했어요.");
      setPhase("captured");
    }
  }

  // 권한 거부/미지원 시 파일 입력(네이티브 카메라) 폴백
  async function onFallbackFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setShot({ url, blob: file });
    setPhase("captured");
  }

  return (
    <main className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-black text-white">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={() => router.back()} aria-label="닫기" className="text-2xl">
          ✕
        </button>
        <button className="flex items-center gap-1 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold">
          {bookLabel} <span aria-hidden className="text-xs">▾</span>
        </button>
        <button
          onClick={toggleTorch}
          aria-label="플래시"
          className={`text-xl ${torchOn ? "text-yellow-300" : "text-white"}`}
        >
          ⚡
        </button>
      </div>

      {/* 뷰파인더 */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {phase === "error" ? (
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <p className="text-sm text-white/70">{errorMsg}</p>
            <label className="cursor-pointer rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black">
              사진 선택 / 촬영
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFallbackFile}
                className="hidden"
              />
            </label>
            <button onClick={() => startStream(facing)} className="text-xs text-white/50 underline">
              다시 시도
            </button>
          </div>
        ) : phase === "captured" || phase === "uploading" ? (
          // 미리보기
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot?.url} alt="촬영본" className="max-h-full max-w-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* 코너 브래킷 + 가이드 */}
            <div className="pointer-events-none absolute inset-8 rounded-lg">
              <span className="absolute left-0 top-0 h-7 w-7 border-l-2 border-t-2 border-white/90" />
              <span className="absolute right-0 top-0 h-7 w-7 border-r-2 border-t-2 border-white/90" />
              <span className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-white/90" />
              <span className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-white/90" />
            </div>
            {phase === "live" && (
              <span className="absolute bottom-6 rounded-full bg-black/60 px-3 py-1.5 text-xs">
                페이지를 네모 안에 맞춰주세요
              </span>
            )}
            {phase === "loading" && (
              <span className="absolute text-sm text-white/60">카메라 준비 중...</span>
            )}
          </>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="px-6 pb-8 pt-4">
        {phase === "captured" || phase === "uploading" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={retake}
              disabled={phase === "uploading"}
              className="flex-1 rounded-full border border-white/40 py-3.5 text-[15px] font-bold text-white disabled:opacity-40"
            >
              다시 찍기
            </button>
            <button
              onClick={usePhoto}
              disabled={phase === "uploading"}
              className="flex-1 rounded-full bg-[#F7EF82] py-3.5 text-[15px] font-bold text-black disabled:opacity-40"
            >
              {phase === "uploading" ? "업로드 중..." : "사용하기"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="h-12 w-12 rounded-lg bg-white/20" aria-hidden />
              <button
                onClick={capture}
                disabled={phase !== "live"}
                aria-label="촬영"
                className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full ring-4 ring-white/70 disabled:opacity-40"
              >
                <span className="h-16 w-16 rounded-full bg-white" />
              </button>
              <button
                onClick={flipCamera}
                aria-label="카메라 전환"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl"
              >
                ↻
              </button>
            </div>
            <div className="mt-5 flex items-center justify-center gap-6 text-sm">
              <span className="rounded-full bg-white px-5 py-1.5 font-bold text-black">사진</span>
              <button onClick={() => window.alert("준비 중이에요.")} className="text-white/60">
                글
              </button>
            </div>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
