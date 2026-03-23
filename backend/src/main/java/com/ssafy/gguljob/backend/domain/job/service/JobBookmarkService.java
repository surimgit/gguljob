package com.ssafy.gguljob.backend.domain.job.service;

import com.ssafy.gguljob.backend.domain.job.dto.JobBookmarkResponseDto;
import com.ssafy.gguljob.backend.domain.job.entity.JobBookmark;
import com.ssafy.gguljob.backend.domain.job.entity.JobPosting;
import com.ssafy.gguljob.backend.domain.job.repository.JobBookmarkRepository;
import com.ssafy.gguljob.backend.domain.job.repository.JobPostingRepository;
import com.ssafy.gguljob.backend.domain.user.entity.User;
import com.ssafy.gguljob.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class JobBookmarkService {

    private final JobBookmarkRepository jobBookmarkRepository;
    private final JobPostingRepository jobPostingRepository;
    private final UserRepository userRepository;

    @Transactional
    public boolean toggleBookmark(Long userId, Long postingId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        JobPosting jobPosting = jobPostingRepository.findById(postingId)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 채용공고입니다."));

        Optional<JobBookmark> existingBookmark = jobBookmarkRepository.findByUserIdAndJobPostingId(userId, postingId);

        if (existingBookmark.isPresent()) {
            jobBookmarkRepository.delete(existingBookmark.get());
            return false;
        } else {
            JobBookmark newBookmark = JobBookmark.builder()
                .user(user)
                .jobPosting(jobPosting)
                .build();
            jobBookmarkRepository.save(newBookmark);
            return true;
        }
    }

    // 내 채용공고 북마크 목록 조회
    @Transactional(readOnly = true)
    public Page<JobBookmarkResponseDto> getMyBookmarkedJobs(Long userId, Pageable pageable) {
        return jobBookmarkRepository.findByUserIdWithJobPosting(userId, pageable)
            .map(bookmark -> JobBookmarkResponseDto.from(bookmark.getJobPosting()));
    }
}