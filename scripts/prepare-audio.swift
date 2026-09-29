import AVFoundation
import Foundation

guard CommandLine.arguments.count == 3 else {
  fputs("사용법: swift scripts/prepare-audio.swift <원본.mp3> <결과.m4a>\n", stderr)
  exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let asset = AVURLAsset(url: input)
let semaphore = DispatchSemaphore(value: 0)
var failure: Error?

Task {
  do {
    let duration = try await asset.load(.duration)
    let tracks = try await asset.loadTracks(withMediaType: .audio)
    guard let track = tracks.first else {
      throw NSError(domain: "wed-invi.audio", code: 1, userInfo: [NSLocalizedDescriptionKey: "오디오 트랙이 없습니다."])
    }

    try? FileManager.default.removeItem(at: output)
    let reader = try AVAssetReader(asset: asset)
    let start = CMTime(seconds: 49, preferredTimescale: 44_100)
    reader.timeRange = CMTimeRange(start: start, duration: duration - start)
    let readerOutput = AVAssetReaderTrackOutput(
      track: track,
      outputSettings: [AVFormatIDKey: kAudioFormatLinearPCM]
    )
    readerOutput.alwaysCopiesSampleData = false
    guard reader.canAdd(readerOutput) else { throw NSError(domain: "wed-invi.audio", code: 2) }
    reader.add(readerOutput)

    let writer = try AVAssetWriter(outputURL: output, fileType: .m4a)
    writer.shouldOptimizeForNetworkUse = true
    let writerInput = AVAssetWriterInput(mediaType: .audio, outputSettings: [
      AVFormatIDKey: kAudioFormatMPEG4AAC,
      AVSampleRateKey: 44_100,
      AVNumberOfChannelsKey: 2,
      AVEncoderBitRateKey: 128_000,
    ])
    guard writer.canAdd(writerInput) else { throw NSError(domain: "wed-invi.audio", code: 3) }
    writer.add(writerInput)
    guard writer.startWriting(), reader.startReading() else {
      throw writer.error ?? reader.error ?? NSError(domain: "wed-invi.audio", code: 4)
    }
    writer.startSession(atSourceTime: start)

    let queue = DispatchQueue(label: "wed-invi.audio.encode")
    writerInput.requestMediaDataWhenReady(on: queue) {
      while writerInput.isReadyForMoreMediaData {
        if let sample = readerOutput.copyNextSampleBuffer() {
          if !writerInput.append(sample) {
            failure = writer.error
            writerInput.markAsFinished()
            writer.cancelWriting()
            semaphore.signal()
            return
          }
        } else {
          writerInput.markAsFinished()
          writer.finishWriting {
            failure = writer.error ?? reader.error
            semaphore.signal()
          }
          return
        }
      }
    }
  } catch {
    failure = error
    semaphore.signal()
  }
}

semaphore.wait()
if let failure {
  fputs("음원 변환 실패: \(failure.localizedDescription)\n", stderr)
  exit(1)
}
print("음원 변환 완료: \(output.path)")
