-- Add admin policies for pro_access_requests table
CREATE POLICY "Admins can view all pro access requests"
ON public.pro_access_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update pro access requests"
ON public.pro_access_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pro access requests"
ON public.pro_access_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));