package com.example.back.service;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

import org.springframework.stereotype.Service;

@Service
public class VideoMetadataService {

  private static final long HEADER_SIZE = 8L;
  private static final long EXTENDED_SIZE_HEADER = 16L;

  public Integer readDurationSeconds(Path videoPath) {
    if (videoPath == null || !Files.isRegularFile(videoPath)) {
      return null;
    }

    try (FileChannel channel = FileChannel.open(videoPath, StandardOpenOption.READ)) {
      return readIsoBaseMediaDuration(channel, 0, channel.size());
    } catch (IOException | RuntimeException ex) {
      return null;
    }
  }

  private Integer readIsoBaseMediaDuration(FileChannel channel, long start, long end)
      throws IOException {
    long position = start;
    while (position + HEADER_SIZE <= end) {
      Atom atom = readAtom(channel, position, end);
      if (atom == null || atom.size() < HEADER_SIZE) {
        return null;
      }

      long payloadStart = position + atom.headerSize();
      long atomEnd = position + atom.size();
      if ("mvhd".equals(atom.type())) {
        return readMovieHeaderDuration(channel, payloadStart, atomEnd);
      }
      if ("moov".equals(atom.type())) {
        Integer duration = readIsoBaseMediaDuration(channel, payloadStart, atomEnd);
        if (duration != null) {
          return duration;
        }
      }

      position = atomEnd;
    }
    return null;
  }

  private Integer readMovieHeaderDuration(FileChannel channel, long start, long end)
      throws IOException {
    ByteBuffer versionBuffer = ByteBuffer.allocate(1);
    readFully(channel, versionBuffer, start);
    int version = Byte.toUnsignedInt(versionBuffer.get(0));

    long timingOffset = version == 1 ? 20L : 12L;
    long timingBytes = version == 1 ? 12L : 8L;
    if (start + timingOffset + timingBytes > end) {
      return null;
    }

    ByteBuffer timingBuffer = ByteBuffer.allocate((int) timingBytes);
    readFully(channel, timingBuffer, start + timingOffset);
    long timescale = Integer.toUnsignedLong(timingBuffer.getInt());
    long duration =
        version == 1 ? timingBuffer.getLong() : Integer.toUnsignedLong(timingBuffer.getInt());
    if (timescale <= 0L || duration <= 0L) {
      return null;
    }

    long seconds = Math.max(1L, Math.round((double) duration / (double) timescale));
    return seconds > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) seconds;
  }

  private Atom readAtom(FileChannel channel, long position, long parentEnd) throws IOException {
    ByteBuffer header = ByteBuffer.allocate((int) HEADER_SIZE);
    readFully(channel, header, position);
    long size = Integer.toUnsignedLong(header.getInt());
    byte[] typeBytes = new byte[4];
    header.get(typeBytes);
    String type = new String(typeBytes, StandardCharsets.US_ASCII);
    long headerSize = HEADER_SIZE;

    if (size == 1L) {
      ByteBuffer extendedSize = ByteBuffer.allocate(Long.BYTES);
      readFully(channel, extendedSize, position + HEADER_SIZE);
      size = extendedSize.getLong();
      headerSize = EXTENDED_SIZE_HEADER;
    } else if (size == 0L) {
      size = parentEnd - position;
    }

    if (size < headerSize || position + size > parentEnd) {
      return null;
    }
    return new Atom(type, size, headerSize);
  }

  private void readFully(FileChannel channel, ByteBuffer buffer, long position) throws IOException {
    buffer.clear();
    while (buffer.hasRemaining()) {
      if (channel.read(buffer, position + buffer.position()) < 0) {
        throw new IOException("Không đọc đủ metadata video.");
      }
    }
    buffer.flip();
  }

  private record Atom(String type, long size, long headerSize) {}
}
