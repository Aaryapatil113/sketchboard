import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_TYPES, MAX_FILE_BYTES, type Sketch, type Week } from "@/lib/data";

export function SubmitSketchDialog({ week, userId, existing }: { week: Week; userId: string; existing?: Sketch | undefined }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? "");
      setDescription(existing?.description ?? "");
      setAltText(existing?.alt_text ?? "");
      setFile(null);
      setPreview(existing?.imageUrl ?? null);
      setFileError(null);
    }
  }, [open, existing]);

  function onFile(f: File | undefined) {
    setFileError(null);
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) return setFileError("Please choose a PNG or JPG image.");
    if (f.size > MAX_FILE_BYTES) return setFileError("Image must be 5MB or smaller.");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!existing && !file) return setFileError("Please choose an image.");
    setSaving(true);
    try {
      let image_path = existing?.image_path;
      if (file) {
        const ext = file.type === "image/png" ? "png" : "jpg";
        const path = `${userId}/${week.id}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("sketches").upload(path, file, { contentType: file.type });
        if (error) throw error;
        image_path = path;
      }
      const fields = { title: title.trim(), description: description.trim(), alt_text: altText.trim(), image_path: image_path! };
      if (existing) {
        const { error } = await supabase.from("submissions").update(fields).eq("id", existing.id);
        if (error) throw error;
        if (file && existing.image_path !== image_path) {
          await supabase.storage.from("sketches").remove([existing.image_path]);
        }
      } else {
        const { error } = await supabase.from("submissions").insert({ ...fields, week_id: week.id, user_id: userId });
        if (error) throw error;
      }
      toast.success(existing ? "Sketch updated" : "Sketch submitted");
      qc.invalidateQueries({ queryKey: ["sketches"] });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">{existing ? "Edit my sketch" : "Submit a sketch"}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {existing ? "Edit your sketch" : `Week ${week.week_number} submission`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sketch-file">Image (PNG or JPG, max 5MB)</Label>
            {preview && <img src={preview} alt="Preview of selected sketch" className="max-h-56 w-full rounded-md bg-muted object-contain" />}
            <Input
              id="sketch-file"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => onFile(e.target.files?.[0])}
              aria-invalid={!!fileError}
              aria-describedby={fileError ? "file-error" : undefined}
            />
            {fileError && <p id="file-error" role="alert" className="text-sm text-destructive">{fileError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sketch-title">Title</Label>
            <Input id="sketch-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sketch-desc">Short description</Label>
            <Textarea
              id="sketch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={3}
              aria-describedby="desc-count"
            />
            <p id="desc-count" className="text-right text-xs text-muted-foreground">{description.length}/300</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sketch-alt">Alt text</Label>
            <Textarea
              id="sketch-alt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              maxLength={300}
              rows={2}
              required
              aria-describedby="alt-help"
            />
            <p id="alt-help" className="text-xs text-muted-foreground">
              Describe what the sketch shows for people using screen readers.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : existing ? "Save changes" : "Submit sketch"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
