// Helper for import-photos.sh, using macOS's built-in ImageIO.
// Usage: swift prepare-photos.swift <max-pixels> <out-dir> <photo>...
// Writes 01.jpg, 02.jpg, … in the order given: turned upright (phone photos store rotation
// as metadata), scaled so the long edge is at most <max-pixels>, and saved without metadata
// so no location or camera details end up on the website. Reads JPEG, PNG, HEIC and WebP.
import Foundation
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(1)
}

let args = CommandLine.arguments
guard args.count >= 4, let maxPixels = Int(args[1]), maxPixels > 0 else {
    fail("Usage: swift prepare-photos.swift <max-pixels> <out-dir> <photo>...")
}
let outDir = URL(fileURLWithPath: args[2], isDirectory: true)

for (index, path) in args.dropFirst(3).enumerated() {
    guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil) else {
        fail("Can't read \(path)")
    }
    let options: [CFString: Any] = [
        kCGImageSourceCreateThumbnailFromImageAlways: true,
        kCGImageSourceCreateThumbnailWithTransform: true,
        kCGImageSourceThumbnailMaxPixelSize: maxPixels,
    ]
    guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
        fail("Can't decode \(path)")
    }
    let target = outDir.appendingPathComponent(String(format: "%02d.jpg", index + 1))
    guard let writer = CGImageDestinationCreateWithURL(
        target as CFURL, UTType.jpeg.identifier as CFString, 1, nil
    ) else {
        fail("Can't write \(target.path)")
    }
    CGImageDestinationAddImage(writer, image, [kCGImageDestinationLossyCompressionQuality: 0.92] as CFDictionary)
    guard CGImageDestinationFinalize(writer) else { fail("Can't save \(target.path)") }
}
