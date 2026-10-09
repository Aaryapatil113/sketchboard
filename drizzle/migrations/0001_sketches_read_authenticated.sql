DROP POLICY IF EXISTS "Sketch images public read" ON storage.objects;
CREATE POLICY "Signed-in users read sketches" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'sketches');