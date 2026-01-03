package com.example.backend.cases;

import com.example.backend.cases.dto.ActivityItemDto;
import com.example.backend.cases.dto.CreateNoteRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases")
public class CaseActivityController {

  private final CaseActivityService activityService;

  public CaseActivityController(CaseActivityService activityService) {
    this.activityService = activityService;
  }

  @GetMapping("/{caseId}/activity")
  public List<ActivityItemDto> getActivity(@PathVariable Long caseId) {
    return activityService.getActivity(caseId);
  }

  @PostMapping("/{caseId}/notes")
  public void addNote(@PathVariable Long caseId, @Valid @RequestBody CreateNoteRequest req) {
    activityService.addNote(caseId, req);
  }

  // ✅ Edit note
  @PutMapping("/{caseId}/notes/{noteId}")
  public void updateNote(
      @PathVariable Long caseId,
      @PathVariable Long noteId,
      @Valid @RequestBody CreateNoteRequest req
  ) {
    activityService.updateNote(caseId, noteId, req);
  }

  // ✅ Optional: Delete note
  @DeleteMapping("/{caseId}/notes/{noteId}")
  public void deleteNote(@PathVariable Long caseId, @PathVariable Long noteId) {
    activityService.deleteNote(caseId, noteId);
  }
}
