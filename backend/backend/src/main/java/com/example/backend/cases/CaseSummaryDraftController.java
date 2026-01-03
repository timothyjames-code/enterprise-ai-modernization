package com.example.backend.cases;

import com.example.backend.cases.dto.AcceptSummaryDraftRequest;
import com.example.backend.cases.dto.CreateSummaryDraftRequest;
import com.example.backend.cases.dto.CaseSummaryDraftDto;
import com.example.backend.cases.dto.RejectSummaryDraftRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cases")
public class CaseSummaryDraftController {

  private final CaseSummaryDraftService service;

  public CaseSummaryDraftController(CaseSummaryDraftService service) {
    this.service = service;
  }

  @PostMapping("/{caseId}/summary-drafts")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public CaseSummaryDraftService.CreateDraftResponse create(
      @PathVariable Long caseId,
      @Valid @RequestBody(required = false) CreateSummaryDraftRequest req
  ) {
    return service.createDraft(caseId, req);
  }

  @GetMapping("/{caseId}/summary-drafts/{draftId}")
  public CaseSummaryDraftDto get(
      @PathVariable Long caseId,
      @PathVariable Long draftId
  ) {
    return service.getDraft(caseId, draftId);
  }

  @PostMapping("/{caseId}/summary-drafts/{draftId}/accept")
  public CaseDto accept(
      @PathVariable Long caseId,
      @PathVariable Long draftId,
      @RequestBody(required = false) AcceptSummaryDraftRequest req
  ) {
    return service.accept(caseId, draftId, req);
  }

  @PostMapping("/{caseId}/summary-drafts/{draftId}/reject")
  public CaseSummaryDraftDto reject(
      @PathVariable Long caseId,
      @PathVariable Long draftId,
      @Valid @RequestBody(required = false) RejectSummaryDraftRequest req
  ) {
    return service.reject(caseId, draftId, req);
  }
}
