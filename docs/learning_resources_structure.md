# Learning Resources Feature Structure

This document outlines the data models and relationships for the Learning Resources feature.

## I. Core Component: Learning Resource

*   **Model:** `LearningResource`
*   **Fields:**
    *   `id`: UUIDField (Primary Key)
    *   `title`: CharField
    *   `resource_type`: CharField (Choices: Video, PDF, Image, Website, Article)
    *   `created_at`, `updated_at`: Inherited from `TimestampMixin`
    *   `quality_vote_count`: IntegerField (Total number of quality votes received)
    *   `quality_vote_sum`: IntegerField (Sum of all 1-5 star ratings)
    *   `accessibility_beginner_count`: IntegerField
    *   `accessibility_moderate_count`: IntegerField
    *   `accessibility_advanced_count`: IntegerField
*   **Properties (calculated in the model):**
    *   `average_quality_rating()`: Calculates `quality_vote_sum / quality_vote_count`.
    *   `dominant_accessibility_level()`: Determines which accessibility level has the most votes.

## II. Associated URLs

*   **Model:** `ResourceURL`
*   **Fields:**
    *   `id`: UUIDField (Primary Key)
    *   `learning_resource`: ForeignKey to `LearningResource`
    *   `url`: URLField (Unique)
    *   `is_primary`: BooleanField (Default: False) - Set to True for the first URL added.
    *   `created_at`: DateTimeField (auto_now_add)
*   **Relationship:** One `LearningResource` to Many `ResourceURL`s. A URL is unique across all resources.

## III. Association with Pages (Article Pages)

*   **Model:** `ResourcePageAssociation`
*   **Fields:**
    *   `id`: UUIDField (Primary Key)
    *   `learning_resource`: ForeignKey to `LearningResource`
    *   `page_slug`: CharField (db_index=True)
    *   `added_by`: ForeignKey to User
    *   `added_at`: DateTimeField (auto_now_add)
    *   `appropriateness_upvotes`: IntegerField (Default: 0)
    *   `appropriateness_downvotes`: IntegerField (Default: 0)
    *   `appropriateness_score`: IntegerField (Default: 0, db_index=True) - Calculated as upvotes - downvotes.
*   **Relationship:** Many-to-Many link between `LearningResource` and `page_slug`s.
*   **Constraint:** Unique together (`learning_resource`, `page_slug`).

## IV. Voting Models

1.  **Overall Quality Vote:**
    *   **Model:** `QualityVote`
    *   **Fields:** `id` (UUID), `user`, `learning_resource`, `rating` (Integer 1-5), `created_at`, `updated_at`.
    *   **Constraint:** Unique together (`user`, `learning_resource`).
    *   **Logic:** `save()`/`delete()` updates `LearningResource.quality_vote_count` and `LearningResource.quality_vote_sum`.

2.  **Accessibility Vote:**
    *   **Model:** `AccessibilityVote`
    *   **Fields:** `id` (UUID), `user`, `learning_resource`, `level` (Choices: Beginner, Moderate, Advanced), `created_at`, `updated_at`.
    *   **Constraint:** Unique together (`user`, `learning_resource`).
    *   **Logic:** `save()`/`delete()` updates `LearningResource.accessibility_beginner_count`, `LearningResource.accessibility_moderate_count`, `LearningResource.accessibility_advanced_count`.

3.  **Appropriateness Vote:**
    *   **Model:** `AppropriatenessVote`
    *   **Fields:** `id` (UUID), `user`, `association` (ForeignKey to `ResourcePageAssociation`), `vote_type` (Choices: Upvote, Downvote), `created_at`.
    *   **Constraint:** Unique together (`user`, `association`).
    *   **Logic:** `save()`/`delete()` updates `ResourcePageAssociation.appropriateness_upvotes`, `ResourcePageAssociation.appropriateness_downvotes`, and `ResourcePageAssociation.appropriateness_score`.

## V. Display / User Interface

### Article Page (`/wiki/<page_slug>/`)

*   **New Section:** Add a dedicated section titled "Learning Resources" below the main article content, similar in layout to how posts might be displayed.
*   **List Resources:** Display a list of `LearningResource` items associated with the current `page_slug` via the `ResourcePageAssociation` model.
*   **Resource Item Display:** Each item in the list should clearly show:
    *   **Title:** `LearningResource.title` as a clickable link navigating to the resource's dedicated page (`/learning-resources/<uuid>/`).
    *   **Type:** `LearningResource.resource_type` (e.g., "Video", "PDF", "Website").
    *   **Quality:** The calculated `LearningResource.average_quality_rating` (e.g., displayed as stars "★★★★☆" and/or numerically "(4.2 / 5)").
    *   **Accessibility:** The calculated `LearningResource.dominant_accessibility_level` (e.g., "Beginner", "Moderate", "Advanced").
    *   **Appropriateness Score:** The `ResourcePageAssociation.appropriateness_score` (e.g., "+5", "-2").
*   **Appropriateness Voting:** Next to each resource item, provide interactive Upvote/Downvote buttons.
    *   These buttons interact with the `AppropriatenessVote` model for the *specific* `ResourcePageAssociation` linking *this* resource to *this* page.
    *   Visually indicate if the current logged-in user has already voted (e.g., highlighted button).
    *   Clicking allows casting or changing a vote.
*   **(Optional) Controls:** Consider adding sorting (e.g., by quality, score, date added) or filtering (e.g., by type, accessibility) options for the resource list on the article page.
*   **(Optional) Pagination:** Implement pagination if the number of associated resources can grow large.

### Learning Resource Page (`/learning-resources/<uuid>/`)

*   **Dedicated Page:** A unique page for each `LearningResource`.
*   **Title:** Display `LearningResource.title` prominently as the page header.
*   **Primary Content Display:**
    *   Attempt to embed the `ResourceURL.url` marked as `is_primary=True` within an `<iframe>`.
    *   *Note:* Be mindful of `X-Frame-Options` headers; some sites may block embedding. Provide a clear fallback.
    *   **Fallback/Alternative:** If iframe embedding is not possible or suitable (e.g., for PDFs, direct downloads), provide a prominent, clearly labeled link to the primary URL.
*   **Additional URLs:** List all other associated `ResourceURL.url`s (where `is_primary=False`) as clickable links below the primary content area.
*   **Quality Display & Voting:**
    *   Show the `LearningResource.average_quality_rating` (e.g., "★★★★☆ (4.2 / 5)").
    *   Provide interactive controls (e.g., 5 clickable stars) for the logged-in user to cast or update their `QualityVote` for this resource.
*   **Accessibility Display & Voting:**
    *   Show the `LearningResource.dominant_accessibility_level` (e.g., "Moderate").
    *   Provide interactive controls (e.g., radio buttons: Beginner, Moderate, Advanced) for the logged-in user to cast or update their `AccessibilityVote` for this resource.
*   **Associated Pages List:** Display a list of all `page_slug`s this resource is associated with (via `ResourcePageAssociation`). Each slug should be a link back to the corresponding article page (`/wiki/<page_slug>/`).
*   **Metadata:** Display `LearningResource.created_at` and `LearningResource.updated_at` timestamps.
