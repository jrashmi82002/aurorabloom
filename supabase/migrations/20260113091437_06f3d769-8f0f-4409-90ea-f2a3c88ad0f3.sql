-- Make diary-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'diary-images';