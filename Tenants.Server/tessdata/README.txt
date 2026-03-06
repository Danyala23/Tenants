Place eng.traineddata here for SNGPL gas bill captcha solving.

1. Download from: https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata
2. File must be ~22MB. If smaller, re-download (may be corrupted).
3. The project copies tessdata/ to output. Rebuild after adding the file.
4. When running via Aspire AppHost, the app looks in: BaseDirectory, CurrentDirectory, and Assembly dir.
5. If captcha still fails, check logs for "SNGPL: tessdata" or "eng.traineddata not found" to see exact path used.
